import net from "node:net";
import { assertPublicAddresses, normalizePublicUrl } from "./public-url-policy.mjs";

const allowedConnectPorts = new Set(["443"]);

export function parseConnectAuthority(authority) {
  const value = String(authority || "").trim();
  let hostname;
  let port;
  if (value.startsWith("[")) {
    const match = value.match(/^\[([^\]]+)]:(\d+)$/);
    if (!match) throw new Error("Invalid CONNECT authority.");
    [, hostname, port] = match;
  } else {
    const split = value.lastIndexOf(":");
    if (split < 1) throw new Error("Invalid CONNECT authority.");
    hostname = value.slice(0, split);
    port = value.slice(split + 1);
  }
  if (!hostname || !allowedConnectPorts.has(port)) throw new Error("CONNECT target is outside the egress policy.");
  if (net.isIP(hostname)) assertPublicAddresses([{ address: hostname }]);
  return { hostname: hostname.toLowerCase(), port: Number(port) };
}

export function parseHttpProxyTarget(rawUrl) {
  const target = normalizePublicUrl(rawUrl);
  if (target.protocol !== "http:" || (target.port && target.port !== "80")) {
    throw new Error("Plain proxy requests are restricted to HTTP port 80.");
  }
  return target;
}

export function choosePinnedAddress(addresses) {
  assertPublicAddresses(addresses);
  const normalized = addresses
    .map(({ address, family }) => ({ address, family: Number(family) || net.isIP(address) }))
    .filter(({ family }) => family === 4 || family === 6)
    .sort((left, right) => left.family - right.family || left.address.localeCompare(right.address));
  if (!normalized.length) throw new Error("DNS did not return a usable public address.");
  return normalized[0];
}

export function normalizePeerAddress(address) {
  const value = String(address || "").split("%")[0].toLowerCase();
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped || value;
}

export function assertPinnedPeer(actual, expected) {
  if (normalizePeerAddress(actual) !== normalizePeerAddress(expected)) {
    throw new Error("Connected peer does not match the DNS-pinned address.");
  }
  return true;
}
