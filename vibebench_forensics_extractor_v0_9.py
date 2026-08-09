#!/usr/bin/env python3
"""VibeBench technical feature extractor.

Two intended uses:
  1) URL mode: fetch a public website and extract deploy-time technical fingerprints.
  2) Batch mode: read URLs from a CSV and produce a feature matrix.

The extractor intentionally separates direct builder/provenance evidence from weak
framework/UI heuristics. The included `rule_score` is a transparent smoke-test score,
NOT a calibrated probability that code was AI-generated.

Standard-library only. No API key required.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import hashlib
import ipaddress
import json
import re
import socket
import ssl
import sys
import time
from collections import Counter
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

USER_AGENT = "VibeBench-Forensics/0.9 (+research; public-web technical fingerprinting)"
DEFAULT_TIMEOUT = 12
MAX_HTML_BYTES = 2_000_000
MAX_ASSET_BYTES = 350_000
MAX_ASSETS_PER_KIND = 6
MAX_REDIRECTS = 8

DIRECT_PATTERNS = {
    "lovable": [r"lovable-tagger", r"lovable\.app", r"lovable\.dev", r"@lovable\.dev", r"lovite"],
    "bolt": [r"bolt\.new", r"stackblitz", r"webcontainer", r"made\s+with\s+bolt"],
    "v0": [r"built\s+with\s+v0", r"v0\.dev", r"v0\.app"],
    "replit": [r"replit-agent", r"built\s+with\s+replit\s+agent", r"replit\s+agent\s+[0-9]"],
    "base44": [r"base44"],
}

TECH_PATTERNS = {
    "nextjs": [r"/_next/", r"__next_data__", r"next-route-announcer", r"next/static"],
    "nuxt": [r"/_nuxt/", r"__nuxt__", r"nuxt-link"],
    "astro": [r"/_astro/", r"astro-island", r"astro-slot"],
    "svelte": [r"data-svelte-h", r"svelte-[a-z0-9]"],
    "angular": [r"ng-version=", r"_ngcontent-", r"ng-reflect-"],
    "vue": [r"data-v-[0-9a-f]{6,}", r"__vue__", r"vue-router"],
    "react": [r"data-reactroot", r"react-dom", r"react-refresh", r"__react"],
    "vite": [r"/@vite/", r"vite\.svg", r"modulepreload"],
    "tanstack_start": [r"@tanstack/react-start", r"tanstack[-_/ ]start", r"tanstack-router", r"__tsr__"],
    "tailwind": [r"--tw-", r"tailwind"],
    "radix": [r"data-radix", r"--radix-", r"@radix-ui"],
    "lucide": [r"lucide(?:-|\s)", r"data-lucide"],
    "framer_motion": [r"framer-motion", r"data-framer-", r"framerusercontent"],
    "supabase": [r"supabase\.co", r"supabase\.in", r"@supabase/"],
    "firebase": [r"firebaseapp\.com", r"firebaseio\.com", r"@firebase/"],
    "clerk": [r"clerk\.com", r"clerk\.accounts", r"@clerk/"],
    "wordpress": [r"wp-content", r"wp-includes", r"generator[^>]*wordpress"],
    "webflow": [r"data-wf-page", r"webflow\.js", r"webflow\.com"],
    "framer_site": [r"framerusercontent\.com", r"data-framer-name", r"framer-site"],
    "wix": [r"wixstatic\.com", r"wix-code", r"wixsite\.com"],
    "squarespace": [r"static1\.squarespace\.com", r"squarespace-cdn"],
}

UTILITY_PREFIXES = (
    "flex", "grid", "gap-", "p-", "px-", "py-", "pt-", "pb-", "pl-", "pr-",
    "m-", "mx-", "my-", "mt-", "mb-", "ml-", "mr-", "w-", "h-", "min-w-",
    "max-w-", "min-h-", "max-h-", "text-", "bg-", "border", "rounded", "shadow",
    "items-", "justify-", "space-", "font-", "leading-", "tracking-", "overflow-",
    "absolute", "relative", "fixed", "sticky", "inset-", "top-", "left-", "right-",
    "bottom-", "z-", "opacity-", "transition", "duration-", "hover:", "focus:",
    "dark:", "sm:", "md:", "lg:", "xl:", "2xl:", "from-", "via-", "to-",
)

HASHED_ASSET_RE = re.compile(r"(?:^|[._-])[0-9a-f]{8,}(?:[._-]|$)", re.I)
SOURCEMAP_RE = re.compile(r"sourceMappingURL\s*=", re.I)


@dataclass
class ParsedHTML:
    title: str = ""
    metas: Dict[str, str] = field(default_factory=dict)
    meta_props: Dict[str, str] = field(default_factory=dict)
    scripts: List[str] = field(default_factory=list)
    stylesheets: List[str] = field(default_factory=list)
    manifests: List[str] = field(default_factory=list)
    canonicals: List[str] = field(default_factory=list)
    classes: List[str] = field(default_factory=list)
    ids: List[str] = field(default_factory=list)
    data_attrs: List[str] = field(default_factory=list)
    comments: List[str] = field(default_factory=list)
    tag_counts: Counter = field(default_factory=Counter)
    jsonld_count: int = 0
    inline_script_bytes: int = 0
    inline_style_bytes: int = 0
    _in_title: bool = False
    _title_chunks: List[str] = field(default_factory=list)
    _script_inline: bool = False
    _style_inline: bool = False


class FingerprintHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.p = ParsedHTML()

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        self.p.tag_counts[tag] += 1
        a = {str(k).lower(): (v or "") for k, v in attrs}
        if tag == "title":
            self.p._in_title = True
        if "class" in a:
            self.p.classes.extend(a["class"].split())
        if "id" in a and a["id"]:
            self.p.ids.append(a["id"])
        for k in a:
            if k.startswith("data-"):
                self.p.data_attrs.append(k)
        if tag == "meta":
            name = a.get("name", "").lower()
            prop = a.get("property", "").lower()
            content = a.get("content", "")
            if name:
                self.p.metas[name] = content
            if prop:
                self.p.meta_props[prop] = content
        elif tag == "script":
            src = a.get("src", "")
            typ = a.get("type", "").lower()
            if src:
                self.p.scripts.append(src)
                self.p._script_inline = False
            else:
                self.p._script_inline = True
            if typ == "application/ld+json":
                self.p.jsonld_count += 1
        elif tag == "style":
            self.p._style_inline = True
        elif tag == "link":
            rel = a.get("rel", "").lower().split()
            href = a.get("href", "")
            if "stylesheet" in rel and href:
                self.p.stylesheets.append(href)
            if "manifest" in rel and href:
                self.p.manifests.append(href)
            if "canonical" in rel and href:
                self.p.canonicals.append(href)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "title":
            self.p._in_title = False
            self.p.title = "".join(self.p._title_chunks).strip()
        elif tag == "script":
            self.p._script_inline = False
        elif tag == "style":
            self.p._style_inline = False

    def handle_data(self, data):
        if self.p._in_title:
            self.p._title_chunks.append(data)
        if self.p._script_inline:
            self.p.inline_script_bytes += len(data.encode("utf-8", "ignore"))
        if self.p._style_inline:
            self.p.inline_style_bytes += len(data.encode("utf-8", "ignore"))

    def handle_comment(self, data):
        self.p.comments.append(data[:5000])


class SafeRedirectHandler(HTTPRedirectHandler):
    def __init__(self, allow_private=False):
        self.allow_private = allow_private
        self.redirects = []
        super().__init__()

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if len(self.redirects) >= MAX_REDIRECTS:
            raise HTTPError(newurl, code, "too many redirects", headers, fp)
        _assert_url_allowed(newurl, self.allow_private)
        self.redirects.append(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        raise ValueError("empty URL")
    if "://" not in url:
        url = "https://" + url
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        raise ValueError("only http/https URLs are supported")
    if not p.hostname:
        raise ValueError("URL has no hostname")
    return url


def _host_is_public(host: str) -> bool:
    if host.lower() in {"localhost", "localhost.localdomain"}:
        return False
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        # DNS failure is handled by the fetch step; not a private-network bypass.
        return True
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
                or ip.is_multicast or ip.is_unspecified):
            return False
    return True


def _assert_url_allowed(url: str, allow_private: bool) -> None:
    p = urlparse(_normalize_url(url))
    if not allow_private and not _host_is_public(p.hostname or ""):
        raise ValueError(f"private/local address blocked: {p.hostname}")


def _fetch(url: str, timeout: int, max_bytes: int, allow_private=False) -> Tuple[str, int, Dict[str, str], bytes, List[str], float]:
    url = _normalize_url(url)
    _assert_url_allowed(url, allow_private)
    redirect = SafeRedirectHandler(allow_private=allow_private)
    opener = build_opener(redirect)
    req = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/javascript,text/css,*/*;q=0.8",
        "Accept-Encoding": "identity",
    })
    t0 = time.perf_counter()
    with opener.open(req, timeout=timeout) as resp:
        body = resp.read(max_bytes + 1)
        if len(body) > max_bytes:
            body = body[:max_bytes]
        final_url = resp.geturl()
        status = getattr(resp, "status", 200)
        headers = {k.lower(): v for k, v in resp.headers.items()}
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return final_url, status, headers, body, redirect.redirects, elapsed_ms


def _decode(body: bytes, headers: Dict[str, str]) -> str:
    ct = headers.get("content-type", "")
    m = re.search(r"charset=([\w.-]+)", ct, re.I)
    enc = m.group(1) if m else "utf-8"
    try:
        return body.decode(enc, "replace")
    except LookupError:
        return body.decode("utf-8", "replace")


def _same_origin(base: str, target: str) -> bool:
    b, t = urlparse(base), urlparse(target)
    bp = b.port or (443 if b.scheme == "https" else 80)
    tp = t.port or (443 if t.scheme == "https" else 80)
    return (b.scheme, b.hostname, bp) == (t.scheme, t.hostname, tp)


def _pattern_hits(text: str, patterns: Dict[str, List[str]]) -> Dict[str, int]:
    low = text.lower()
    out = {}
    for name, pats in patterns.items():
        total = 0
        for pat in pats:
            total += len(re.findall(pat, low, flags=re.I))
        out[name] = total
    return out


def _bool_flags(prefix: str, hits: Dict[str, int]) -> Dict[str, int]:
    d = {}
    for k, v in hits.items():
        d[f"{prefix}_{k}_hits"] = int(v)
        d[f"{prefix}_{k}_flag"] = int(v > 0)
    return d


def _tls_info(host: str, port: int = 443, timeout: int = 5) -> Dict[str, str]:
    out = {"tls_subject_cn": "", "tls_issuer_org": "", "tls_not_after": ""}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()
        subject = dict(x[0] for x in cert.get("subject", []))
        issuer = dict(x[0] for x in cert.get("issuer", []))
        out["tls_subject_cn"] = subject.get("commonName", "")
        out["tls_issuer_org"] = issuer.get("organizationName", "")
        out["tls_not_after"] = cert.get("notAfter", "")
    except Exception:
        pass
    return out


def _special_file(base_url: str, path: str, timeout: int, allow_private: bool) -> Tuple[int, int, str]:
    url = urljoin(base_url, path)
    try:
        _, status, headers, body, _, _ = _fetch(url, timeout, 250_000, allow_private)
        text = _decode(body, headers)
        return int(status), len(body), text[:250_000]
    except Exception:
        return 0, 0, ""


def _asset_features(base_url: str, parsed: ParsedHTML, timeout: int, allow_private: bool) -> Tuple[Dict[str, int], str]:
    feats: Dict[str, int] = {
        "same_origin_js_fetched": 0,
        "same_origin_css_fetched": 0,
        "js_bytes_scanned": 0,
        "css_bytes_scanned": 0,
        "js_sourcemap_markers": 0,
        "hashed_asset_name_count": 0,
        "asset_fetch_errors": 0,
    }
    chunks: List[str] = []

    js_urls = [urljoin(base_url, x) for x in parsed.scripts]
    css_urls = [urljoin(base_url, x) for x in parsed.stylesheets]
    all_assets = js_urls + css_urls
    feats["hashed_asset_name_count"] = sum(bool(HASHED_ASSET_RE.search(urlparse(x).path)) for x in all_assets)

    targets = []
    for kind, urls in (("js", js_urls), ("css", css_urls)):
        seen = set()
        count = 0
        for u in urls:
            if u in seen or not _same_origin(base_url, u):
                continue
            seen.add(u)
            if count >= MAX_ASSETS_PER_KIND:
                break
            count += 1
            targets.append((kind, u))

    def fetch_asset(target):
        kind, asset_url = target
        try:
            _, status, headers, body, _, _ = _fetch(
                asset_url, timeout, MAX_ASSET_BYTES, allow_private
            )
            if not (200 <= int(status) < 400):
                return kind, b"", "", False
            return kind, body, _decode(body, headers), True
        except Exception:
            return kind, b"", "", False

    # Assets are independent observations. Parallel fetches keep a slow asset from
    # multiplying the per-site timeout while preserving the same feature limits.
    if targets:
        workers = min(6, len(targets))
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            for kind, body, txt, ok in pool.map(fetch_asset, targets):
                if not ok:
                    feats["asset_fetch_errors"] += 1
                    continue
                chunks.append(txt)
                feats[f"same_origin_{kind}_fetched"] += 1
                feats[f"{kind}_bytes_scanned"] += len(body)
                if kind == "js":
                    feats["js_sourcemap_markers"] += len(SOURCEMAP_RE.findall(txt))
    return feats, "\n".join(chunks)


def _rule_score(feats: Dict[str, object]) -> Tuple[int, str]:
    """Transparent smoke-test score, not a calibrated AI probability."""
    score = 0
    reasons = []
    for builder in ("lovable", "bolt", "v0", "replit", "base44"):
        hits = int(feats.get(f"builder_{builder}_hits", 0) or 0)
        if hits:
            add = min(55, 25 + hits * 5)
            score += add
            reasons.append(f"direct {builder} artifacts +{add}")
    host = str(feats.get("hostname", ""))
    if int(feats.get("hosting_lovable_app_flag", 0) or 0):
        score += 30; reasons.append("lovable.app deployment +30")
    if int(feats.get("header_x_vercel_id_flag", 0) or 0) and int(feats.get("tech_nextjs_flag", 0) or 0):
        score += 2; reasons.append("Vercel+Next weak +2")
    if int(feats.get("tech_tailwind_flag", 0) or 0) and int(feats.get("tech_radix_flag", 0) or 0):
        score += 2; reasons.append("Tailwind+Radix weak +2")
    # UI-pattern heuristics are intentionally tiny.
    utility_ratio = float(feats.get("utility_class_ratio", 0) or 0)
    if utility_ratio > 0.45:
        score += 1; reasons.append("high utility-class ratio +1")
    return min(100, score), "; ".join(reasons)


def scan_url(url: str, timeout: int = DEFAULT_TIMEOUT, allow_private: bool = False) -> Dict[str, object]:
    result: Dict[str, object] = {
        "requested_url": url,
        "scan_ok": 0,
        "scan_error": "",
    }
    try:
        normalized = _normalize_url(url)
        final_url, status, headers, body, redirects, elapsed_ms = _fetch(
            normalized, timeout, MAX_HTML_BYTES, allow_private
        )
        html = _decode(body, headers)
        parser = FingerprintHTMLParser()
        parser.feed(html)
        p = parser.p

        up = urlparse(final_url)
        hostname = up.hostname or ""
        result.update({
            "scan_ok": 1,
            "final_url": final_url,
            "scheme": up.scheme,
            "hostname": hostname,
            "status_code": int(status),
            "redirect_count": len(redirects),
            "response_ms": round(elapsed_ms, 2),
            "html_bytes": len(body),
            "html_sha256": hashlib.sha256(body).hexdigest(),
            "content_type": headers.get("content-type", ""),
            "server_header": headers.get("server", ""),
            "x_powered_by": headers.get("x-powered-by", ""),
            "cache_control": headers.get("cache-control", ""),
            "title_len": len(p.title),
            "meta_generator": p.metas.get("generator", ""),
            "meta_description_len": len(p.metas.get("description", "")),
            "canonical_count": len(p.canonicals),
            "jsonld_count": p.jsonld_count,
            "og_tag_count": sum(1 for k in p.meta_props if k.startswith("og:")),
            "script_tag_count": len(p.scripts),
            "stylesheet_count": len(p.stylesheets),
            "manifest_link_count": len(p.manifests),
            "inline_script_bytes": p.inline_script_bytes,
            "inline_style_bytes": p.inline_style_bytes,
            "html_comment_count": len(p.comments),
            "element_count": sum(p.tag_counts.values()),
            "h1_count": p.tag_counts.get("h1", 0),
            "button_count": p.tag_counts.get("button", 0),
            "form_count": p.tag_counts.get("form", 0),
            "class_token_count": len(p.classes),
            "unique_class_token_count": len(set(p.classes)),
            "id_count": len(p.ids),
            "data_attr_count": len(p.data_attrs),
            "unique_data_attr_count": len(set(p.data_attrs)),
        })

        # Hosting/domain context. These are not direct AI-provenance signals by themselves.
        host_l = hostname.lower()
        result["hosting_lovable_app_flag"] = int(host_l.endswith(".lovable.app"))
        result["hosting_replit_app_flag"] = int(host_l.endswith(".replit.app"))
        result["hosting_vercel_app_flag"] = int(host_l.endswith(".vercel.app"))
        result["hosting_netlify_app_flag"] = int(host_l.endswith(".netlify.app"))

        for header_name in ("x-vercel-id", "x-nf-request-id", "cf-ray", "x-render-origin-server", "x-replit-user-id"):
            key = "header_" + header_name.replace("-", "_") + "_flag"
            result[key] = int(bool(headers.get(header_name, "")))

        # Utility/CSS-class heuristics.
        class_tokens = p.classes
        utility_count = sum(any(tok.startswith(pref) for pref in UTILITY_PREFIXES) for tok in class_tokens)
        result["utility_class_count"] = utility_count
        result["utility_class_ratio"] = round(utility_count / max(1, len(class_tokens)), 4)
        result["rounded_class_count"] = sum(tok.startswith("rounded") for tok in class_tokens)
        result["gradient_class_count"] = sum(tok.startswith(("bg-gradient", "from-", "via-", "to-")) for tok in class_tokens)
        result["shadow_class_count"] = sum(tok.startswith("shadow") for tok in class_tokens)
        result["arbitrary_value_class_count"] = sum("[" in tok and "]" in tok for tok in class_tokens)
        result["data_slot_count"] = sum(x == "data-slot" for x in p.data_attrs)
        result["data_component_id_count"] = sum(x == "data-component-id" for x in p.data_attrs)

        asset_feats, asset_text = _asset_features(final_url, p, timeout, allow_private)
        result.update(asset_feats)

        comments_text = "\n".join(p.comments)
        whole_text = "\n".join([html, asset_text, comments_text, json.dumps(headers)])
        result.update(_bool_flags("builder", _pattern_hits(whole_text, DIRECT_PATTERNS)))
        result.update(_bool_flags("tech", _pattern_hits(whole_text, TECH_PATTERNS)))

        # Detect likely shadcn as a compound signature rather than a single magic token.
        result["tech_shadcn_compound_flag"] = int(
            (result.get("data_slot_count", 0) > 0 or result.get("tech_radix_flag", 0))
            and result.get("tech_tailwind_flag", 0)
        )

        manifest_path = p.manifests[0] if p.manifests else "/manifest.json"
        special_paths = ("/robots.txt", "/sitemap.xml", manifest_path)
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            robots_result, sitemap_result, manifest_result = pool.map(
                lambda path: _special_file(final_url, path, timeout, allow_private),
                special_paths,
            )
        robots_status, robots_bytes, robots_text = robots_result
        sitemap_status, sitemap_bytes, sitemap_text = sitemap_result
        manifest_status, manifest_bytes, manifest_text = manifest_result
        result.update({
            "robots_status": robots_status,
            "robots_bytes": robots_bytes,
            "robots_has_sitemap": int("sitemap:" in robots_text.lower()),
            "sitemap_status": sitemap_status,
            "sitemap_bytes": sitemap_bytes,
            "manifest_status": manifest_status,
            "manifest_bytes": manifest_bytes,
        })

        # DNS/TLS light features.
        try:
            ips = sorted({x[4][0] for x in socket.getaddrinfo(hostname, None)})
        except Exception:
            ips = []
        result["resolved_ip_count"] = len(ips)
        result["has_ipv6"] = int(any(":" in ip for ip in ips))
        if up.scheme == "https" and hostname:
            result.update(_tls_info(hostname, up.port or 443, timeout=min(timeout, 5)))
        else:
            result.update({"tls_subject_cn":"", "tls_issuer_org":"", "tls_not_after":""})

        score, reasons = _rule_score(result)
        result["rule_score"] = score
        result["rule_score_reasons"] = reasons
        return result
    except Exception as e:
        result["scan_error"] = f"{type(e).__name__}: {e}"
        return result


def _domain_group(url: str) -> str:
    try:
        host = (urlparse(_normalize_url(url)).hostname or "").lower()
        parts = host.split(".")
        return ".".join(parts[-2:]) if len(parts) >= 2 else host
    except Exception:
        return ""


def _write_batch_csv(output_csv: str, outputs: List[Dict[str, object]]) -> None:
    all_keys = []
    seen_keys = set()
    for row in outputs:
        for key in row:
            if key not in seen_keys:
                seen_keys.add(key)
                all_keys.append(key)
    with open(output_csv, "w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=all_keys)
        writer.writeheader()
        writer.writerows(outputs)


def batch_scan(input_csv: str, output_csv: str, url_column: str, carry: List[str], timeout: int,
               allow_private: bool, limit: Optional[int], workers: int, resume: bool) -> None:
    with open(input_csv, "r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    if limit is not None:
        rows = rows[:limit]
    existing = {}
    output_path = Path(output_csv)
    if resume and output_path.exists():
        with output_path.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                key = row.get("src_sample_id") or row.get("requested_url")
                if key:
                    existing[key] = row

    outputs_by_index = {}
    pending = []
    for index, src in enumerate(rows):
        url = (src.get(url_column) or "").strip()
        if not url:
            continue
        key = src.get("sample_id") or url
        if key in existing:
            outputs_by_index[index] = existing[key]
        else:
            pending.append((index, src, url))

    def scan_one(item):
        index, src, url = item
        feat = scan_url(url, timeout=timeout, allow_private=allow_private)
        out = {f"src_{k}": src.get(k, "") for k in carry}
        out["src_url_group"] = _domain_group(url)
        out.update(feat)
        return index, url, feat, out

    completed = len(outputs_by_index)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = [pool.submit(scan_one, item) for item in pending]
        for future in concurrent.futures.as_completed(futures):
            index, url, feat, out = future.result()
            outputs_by_index[index] = out
            completed += 1
            ordered = [outputs_by_index[i] for i in sorted(outputs_by_index)]
            _write_batch_csv(output_csv, ordered)
            print(
                f"[{completed}/{len(rows)}] {url} -> ok={feat.get('scan_ok')} "
                f"score={feat.get('rule_score','')} err={feat.get('scan_error','')[:80]}",
                file=sys.stderr,
                flush=True,
            )
    _write_batch_csv(output_csv, [outputs_by_index[i] for i in sorted(outputs_by_index)])


def main():
    ap = argparse.ArgumentParser(description="Extract deploy-time technical fingerprints from public websites.")
    ap.add_argument("url", nargs="?", help="single URL to scan")
    ap.add_argument("--input-csv")
    ap.add_argument("--output-csv")
    ap.add_argument("--url-column", default="target_url")
    ap.add_argument("--carry", default="sample_id,cohort,label_target,tool_or_builder,evidence_level")
    ap.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=1, help="number of URLs to scan concurrently")
    ap.add_argument("--resume", action="store_true", help="reuse completed rows from the output CSV")
    ap.add_argument("--allow-private", action="store_true", help="allow localhost/private IPs (testing only)")
    args = ap.parse_args()

    if args.input_csv:
        if not args.output_csv:
            ap.error("--output-csv is required with --input-csv")
        batch_scan(args.input_csv, args.output_csv, args.url_column,
                   [x.strip() for x in args.carry.split(",") if x.strip()],
                   args.timeout, args.allow_private, args.limit, args.workers, args.resume)
        return
    if not args.url:
        ap.error("provide a URL or --input-csv")
    print(json.dumps(scan_url(args.url, timeout=args.timeout, allow_private=args.allow_private), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
