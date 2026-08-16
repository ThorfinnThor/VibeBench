import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { Readable } from "node:stream";
import { assertPinnedPeer, choosePinnedAddress } from "./peer-pinned-egress-policy.mjs";
import { assertPublicAddresses, normalizePublicUrl } from "./public-url-policy.mjs";

const DEFAULT_DNS_TIMEOUT_MS = 4_000;
const MAX_RESPONSE_HEADER_BYTES = 32_768;

function hostWithoutBrackets(url) {
  return url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

export async function resolvePinnedPublicTarget(input, { resolver = lookup, timeoutMs = DEFAULT_DNS_TIMEOUT_MS } = {}) {
  const url = normalizePublicUrl(input.toString());
  const hostname = hostWithoutBrackets(url);
  let addresses;
  if (net.isIP(hostname)) {
    addresses = [{ address: hostname, family: net.isIP(hostname) }];
  } else {
    let timer;
    addresses = await Promise.race([
      resolver(hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("DNS lookup timeout.")), timeoutMs);
        timer.unref?.();
      })
    ]).finally(() => clearTimeout(timer));
  }
  assertPublicAddresses(addresses);
  return { url, hostname, addresses, pinned: choosePinnedAddress(addresses) };
}

export function buildPinnedRequestOptions({ url, hostname, pinned }, { method = "GET", headers = {}, signal } = {}) {
  return {
    protocol: url.protocol,
    hostname,
    port: url.protocol === "https:" ? 443 : 80,
    method,
    path: `${url.pathname}${url.search}`,
    headers: {
      ...headers,
      host: url.host,
      connection: "close",
      "accept-encoding": "identity"
    },
    agent: false,
    signal,
    maxHeaderSize: MAX_RESPONSE_HEADER_BYTES,
    servername: net.isIP(hostname) ? undefined : hostname,
    lookup(_hostname, _options, callback) {
      if (_options?.all) callback(null, [{ address: pinned.address, family: pinned.family }]);
      else callback(null, pinned.address, pinned.family);
    }
  };
}

export async function pinnedPublicFetch(input, options = {}) {
  const target = await resolvePinnedPublicTarget(input, options);
  const requestOptions = buildPinnedRequestOptions(target, options);
  const transport = target.url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = transport.request(requestOptions, (incoming) => {
      try {
        assertPinnedPeer(incoming.socket.remoteAddress, target.pinned.address);
        const response = new Response(Readable.toWeb(incoming), {
          status: incoming.statusCode || 500,
          statusText: incoming.statusMessage || "",
          headers: incoming.headers
        });
        settled = true;
        resolve(response);
      } catch (error) {
        incoming.destroy(error);
        reject(error);
      }
    });
    request.once("socket", (socket) => {
      const connectedEvent = target.url.protocol === "https:" ? "secureConnect" : "connect";
      socket.once(connectedEvent, () => {
        try {
          assertPinnedPeer(socket.remoteAddress, target.pinned.address);
        } catch (error) {
          socket.destroy(error);
        }
      });
    });
    request.once("error", (error) => {
      if (!settled) reject(error);
    });
    request.end();
  });
}
