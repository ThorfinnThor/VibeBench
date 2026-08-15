import dns from "node:dns/promises";
import http from "node:http";
import net from "node:net";
import { Transform } from "node:stream";
import {
  assertPinnedPeer,
  choosePinnedAddress,
  parseConnectAuthority,
  parseHttpProxyTarget
} from "../../lib/peer-pinned-egress-policy.mjs";

const listenPort = Number(process.env.EGRESS_PORT || 8080);
const dnsTimeoutMs = Number(process.env.EGRESS_DNS_TIMEOUT_MS || 5000);
const connectTimeoutMs = Number(process.env.EGRESS_CONNECT_TIMEOUT_MS || 10000);
const tunnelByteLimit = Number(process.env.EGRESS_TUNNEL_BYTE_LIMIT || 33554432);
const httpResponseByteLimit = Number(process.env.EGRESS_HTTP_RESPONSE_BYTE_LIMIT || 8388608);
const maxConnections = Number(process.env.EGRESS_MAX_CONNECTIONS || 64);
let activeConnections = 0;

function publicLookup(hostname) {
  return Promise.race([
    dns.lookup(hostname, { all: true, verbatim: true }).then(choosePinnedAddress),
    new Promise((_, reject) => setTimeout(() => reject(new Error("DNS policy timeout.")), dnsTimeoutMs))
  ]);
}

function reject(socket, status = "403 Forbidden") {
  if (socket.writable) socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  else socket.destroy();
}

function boundedPipe(source, destination, counter) {
  source.on("data", (chunk) => {
    counter.bytes += chunk.length;
    if (counter.bytes > tunnelByteLimit) {
      source.destroy(new Error("Egress tunnel byte budget exceeded."));
      destination.destroy();
    }
  });
  source.pipe(destination);
}

const server = http.createServer(async (request, response) => {
  if (request.url === "/health" && request.headers.host === `127.0.0.1:${listenPort}`) {
    response.writeHead(200, { "content-type": "text/plain", "content-length": "2" });
    response.end("ok");
    return;
  }
  if (!new Set(["GET", "HEAD"]).has(request.method || "")) {
    response.writeHead(405, { connection: "close", "content-length": "0" });
    response.end();
    return;
  }
  if (request.headers["transfer-encoding"] || Number(request.headers["content-length"] || 0) > 0) {
    response.writeHead(400, { connection: "close", "content-length": "0" });
    response.end();
    return;
  }
  try {
    const target = parseHttpProxyTarget(request.url);
    const pinned = await publicLookup(target.hostname);
    const headers = { ...request.headers, host: target.host, connection: "close" };
    delete headers["proxy-authorization"];
    delete headers["proxy-connection"];
    const upstream = http.request({
      host: pinned.address,
      family: pinned.family,
      port: 80,
      method: request.method,
      path: `${target.pathname}${target.search}`,
      headers,
      timeout: connectTimeoutMs
    }, (upstreamResponse) => {
      try { assertPinnedPeer(upstreamResponse.socket.remoteAddress, pinned.address); }
      catch { upstreamResponse.destroy(); response.destroy(); return; }
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      let responseBytes = 0;
      const limiter = new Transform({ transform(chunk, _, callback) {
        responseBytes += chunk.length;
        callback(responseBytes > httpResponseByteLimit ? new Error("HTTP response byte budget exceeded.") : null, chunk);
      } });
      limiter.on("error", () => { upstreamResponse.destroy(); response.destroy(); });
      upstreamResponse.pipe(limiter).pipe(response);
    });
    upstream.on("timeout", () => upstream.destroy(new Error("Egress connection timeout.")));
    upstream.on("error", () => {
      if (!response.headersSent) response.writeHead(502, { connection: "close", "content-length": "0" });
      response.end();
    });
    request.pipe(upstream);
  } catch {
    response.writeHead(403, { connection: "close", "content-length": "0" });
    response.end();
  }
});

server.on("connect", async (request, clientSocket, head) => {
  if (activeConnections >= maxConnections || head.length) return reject(clientSocket, "429 Too Many Requests");
  activeConnections += 1;
  let upstream;
  const release = () => { activeConnections = Math.max(0, activeConnections - 1); };
  try {
    const target = parseConnectAuthority(request.url);
    const pinned = await publicLookup(target.hostname);
    upstream = net.connect({ host: pinned.address, family: pinned.family, port: target.port });
    upstream.setTimeout(connectTimeoutMs, () => upstream.destroy(new Error("Egress connection timeout.")));
    upstream.once("connect", () => {
      try { assertPinnedPeer(upstream.remoteAddress, pinned.address); }
      catch { reject(clientSocket); upstream.destroy(); return; }
      upstream.setTimeout(0);
      clientSocket.write("HTTP/1.1 200 Connection Established\r\nProxy-Agent: VibeBench-Egress-v4\r\n\r\n");
      const counter = { bytes: 0 };
      boundedPipe(clientSocket, upstream, counter);
      boundedPipe(upstream, clientSocket, counter);
    });
    upstream.once("close", release);
    upstream.once("error", () => reject(clientSocket, "502 Bad Gateway"));
    clientSocket.once("error", () => upstream?.destroy());
    clientSocket.once("close", () => upstream?.destroy());
  } catch {
    release();
    reject(clientSocket);
    upstream?.destroy();
  }
});

server.on("clientError", (_, socket) => reject(socket, "400 Bad Request"));
server.listen(listenPort, "0.0.0.0");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
