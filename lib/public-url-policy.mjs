import net from "node:net";

const explicitScheme = /^[a-z][a-z0-9+.-]*:/i;

export function normalizePublicUrl(value) {
  const input = String(value || "").trim();
  if (!input || input.length > 2048) throw new Error("Bitte eine gültige öffentliche URL eingeben.");
  if (explicitScheme.test(input) && !/^https?:/i.test(input)) {
    throw new Error("Nur öffentliche HTTP- und HTTPS-URLs werden unterstützt.");
  }
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    throw new Error("Bitte eine gültige öffentliche URL eingeben.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Nur öffentliche HTTP- und HTTPS-URLs werden unterstützt.");
  if (url.username || url.password) throw new Error("URLs mit Zugangsdaten werden nicht unterstützt.");
  const defaultPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== defaultPort) throw new Error("Nur die öffentlichen Standardports 80 und 443 werden unterstützt.");
  url.hash = "";
  return url;
}

function ipv4Number(address) {
  return address.split(".").reduce((value, part) => (value << 8n) + BigInt(Number(part)), 0n);
}

function ipv4InCidr(address, base, bits) {
  const shift = BigInt(32 - bits);
  return (ipv4Number(address) >> shift) === (ipv4Number(base) >> shift);
}

function expandIpv6(address) {
  let source = address.toLowerCase().split("%")[0];
  const embedded = source.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (embedded) {
    if (!net.isIPv4(embedded)) return null;
    const value = Number(ipv4Number(embedded));
    source = source.slice(0, -embedded.length) + `${((value >>> 16) & 0xffff).toString(16)}:${(value & 0xffff).toString(16)}`;
  }
  const sides = source.split("::");
  if (sides.length > 2) return null;
  const left = sides[0] ? sides[0].split(":") : [];
  const right = sides[1] ? sides[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((sides.length === 1 && missing !== 0) || missing < 0) return null;
  const groups = [...left, ...new Array(sides.length === 2 ? missing : 0).fill("0"), ...right];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16));
}

function ipv6Number(address) {
  const groups = expandIpv6(address);
  if (!groups) return null;
  return groups.reduce((value, group) => (value << 16n) + BigInt(group), 0n);
}

function ipv6InCidr(address, base, bits) {
  const value = ipv6Number(address);
  const baseValue = ipv6Number(base);
  if (value === null || baseValue === null) return false;
  const shift = BigInt(128 - bits);
  return (value >> shift) === (baseValue >> shift);
}

function mappedIpv4(address) {
  const groups = expandIpv6(address);
  if (!groups || groups.slice(0, 5).some(Boolean) || groups[5] !== 0xffff) return null;
  return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
}

const blockedIpv4 = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]
];

const blockedIpv6 = [
  ["::", 128], ["::1", 128], ["::", 96], ["64:ff9b::", 96], ["64:ff9b:1::", 48],
  ["100::", 64], ["2001::", 32], ["2001:2::", 48], ["2001:10::", 28],
  ["2001:20::", 28], ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7],
  ["fe80::", 10], ["fec0::", 10], ["ff00::", 8]
];

export function isNonPublicIp(address) {
  if (net.isIPv4(address)) return blockedIpv4.some(([base, bits]) => ipv4InCidr(address, base, bits));
  if (!net.isIPv6(address)) return true;
  const mapped = mappedIpv4(address);
  if (mapped) return isNonPublicIp(mapped);
  return blockedIpv6.some(([base, bits]) => ipv6InCidr(address, base, bits));
}

export function assertPublicAddresses(addresses) {
  if (!addresses.length || addresses.some(({ address }) => isNonPublicIp(address))) {
    throw new Error("Die URL verweist auf eine lokale, reservierte oder nicht öffentliche Adresse.");
  }
}
