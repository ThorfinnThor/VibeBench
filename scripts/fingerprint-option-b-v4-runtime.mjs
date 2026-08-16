import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const groups = {
  collector: [
    ".dockerignore", "infra/option-b-v4/compose.yml", "infra/option-b-v4/Dockerfile.collector", "infra/option-b-v4/seccomp_profile.json", "package.json", "package-lock.json",
    "lib/public-url-policy.mjs", "lib/option-b-v4-capture.mjs",
    "scripts/run-development-v0_5-option-b-v4-isolated-pilot.mjs", "scripts/smoke-option-b-v4-capture.mjs",
    "outputs/development_v0_5_option_b_v4/option_b_capture_contract_v4.json", "outputs/development_v0_5_option_b_v4/option_b_v4_pilot_manifest.json",
    "outputs/development_v0_5_option_b_v4/option_b_v4_extension_20_manifest_v1.json", "outputs/development_v0_5_option_b_v4/option_b_v4_repeat_waiver_v1.json"
  ],
  egress: [".dockerignore", "infra/option-b-v4/compose.yml", "infra/option-b-v4/Dockerfile.egress", "infra/option-b-v4/egress-proxy.mjs", "lib/public-url-policy.mjs", "lib/peer-pinned-egress-policy.mjs"]
};

async function fingerprint(files) {
  const digest = createHash("sha256");
  for (const file of [...files].sort()) {
    digest.update(file); digest.update("\0"); digest.update(await readFile(file)); digest.update("\0");
  }
  return digest.digest("hex");
}
const result = { collector_source_sha256: await fingerprint(groups.collector), egress_source_sha256: await fingerprint(groups.egress) };
if (process.argv.includes("--github-env")) {
  process.stdout.write(`OPTION_B_V4_COLLECTOR_SOURCE_SHA256=${result.collector_source_sha256}\nOPTION_B_V4_EGRESS_SOURCE_SHA256=${result.egress_source_sha256}\n`);
} else process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
