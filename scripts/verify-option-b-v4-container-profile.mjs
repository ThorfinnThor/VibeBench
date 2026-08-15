import { readFile } from "node:fs/promises";

const roleIndex = process.argv.indexOf("--role");
const role = roleIndex >= 0 ? process.argv[roleIndex + 1] : null;
if (!new Set(["collector", "egress"]).has(role)) throw new Error("Use --role collector or --role egress.");
const input = JSON.parse(await readFile(0, "utf8"));
if (!Array.isArray(input) || input.length !== 1) throw new Error("Expected one docker inspect record.");
const record = input[0];
const user = String(record.Config?.User || "");
if (!user || /^(?:0(?::0)?|root)$/i.test(user)) throw new Error(`${role} must run as a non-root user.`);
if (record.HostConfig?.ReadonlyRootfs !== true) throw new Error(`${role} root filesystem must be read-only.`);
if (!record.HostConfig?.CapDrop?.includes("ALL")) throw new Error(`${role} must drop all Linux capabilities.`);
if (!record.HostConfig?.SecurityOpt?.some((value) => /no-new-privileges/i.test(value))) throw new Error(`${role} must set no-new-privileges.`);
for (const [key, value] of [["PidsLimit", record.HostConfig?.PidsLimit], ["Memory", record.HostConfig?.Memory], ["NanoCpus", record.HostConfig?.NanoCpus]]) {
  if (!(Number(value) > 0)) throw new Error(`${role} must set ${key}.`);
}
if ((record.Mounts || []).some((mount) => /docker\.sock/i.test(`${mount.Source || ""}${mount.Destination || ""}`))) throw new Error(`${role} must not mount the Docker socket.`);
if (role === "collector") {
  if (!record.HostConfig?.SecurityOpt?.some((value) => /seccomp/i.test(value))) throw new Error("Collector must use the frozen Chromium sandbox seccomp profile.");
  const networks = Object.keys(record.NetworkSettings?.Networks || {});
  if (networks.length !== 1 || !networks[0].endsWith("_collector_internal")) throw new Error("Collector must attach only to the internal network.");
  const writable = (record.Mounts || []).filter((mount) => mount.RW);
  if (writable.length !== 1 || writable[0].Destination !== "/artifacts") throw new Error("Collector may write only to /artifacts.");
  if (Object.keys(record.NetworkSettings?.Ports || {}).some((key) => record.NetworkSettings.Ports[key])) throw new Error("Collector must not publish ports.");
} else {
  const networks = Object.keys(record.NetworkSettings?.Networks || {});
  if (networks.length !== 2 || !networks.some((name) => name.endsWith("_collector_internal")) || !networks.some((name) => name.endsWith("_public_egress"))) throw new Error("Egress must bridge only the internal and public-egress networks.");
}
process.stdout.write(`${role} container profile verified\n`);
