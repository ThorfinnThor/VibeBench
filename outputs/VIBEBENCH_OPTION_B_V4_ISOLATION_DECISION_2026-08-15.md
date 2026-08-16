# VibeBench Option-B-v4: Isolation Decision and Pilot Gate

Date: 2026-08-15 (execution status updated 2026-08-16)
Status: **IMPLEMENTED — RUN 1 PASSED; EARLY REPEAT ACCEPTED BY EXPLICIT OWNER WAIVER; FIXED 20-SITE EXTENSION AUTHORIZED**

The exact execution evidence and repeat comparison are recorded in
[`VIBEBENCH_OPTION_B_V4_EARLY_REPEAT_2026-08-16.md`](VIBEBENCH_OPTION_B_V4_EARLY_REPEAT_2026-08-16.md).

## Decision

Option-B v4 will run in a short-lived Docker environment on an ephemeral
GitHub-hosted runner. The collector itself has no direct Internet route. It is
attached only to a Docker `internal` network and reaches public websites through
a separate egress proxy.

The egress proxy:

- permits only HTTP GET/HEAD on port 80 and HTTPS CONNECT on port 443;
- resolves the target itself and rejects the entire answer set if any address is
  local, private, reserved or otherwise non-public;
- selects one deterministic public address, connects directly to that address
  and verifies the connected peer before forwarding traffic;
- does not persist or log raw URLs or hostnames;
- applies DNS, connection, concurrent-connection and tunnel-byte limits.

The collector:

- runs as the non-root `pwuser`;
- uses a read-only root filesystem, drops all Linux capabilities and enables
  `no-new-privileges`;
- uses the official Playwright v1.54.2 seccomp profile so Chromium can keep its
  sandbox while visiting untrusted pages;
- has PID, CPU, memory, shared-memory and temporary-filesystem limits;
- blocks service workers, WebSockets, downloads, non-HTTP protocols and methods
  other than GET/HEAD;
- writes only privacy-minimal capture and attempt-audit JSON to `/artifacts`;
- never receives labels, cohorts, previous scores or previous features.

The final built image IDs are recorded for each run. Repeat equivalence is bound
to the base-image registry digests plus deterministic source fingerprints,
because separately built final Docker IDs may contain build metadata and need
not be byte-identical.

## Why this environment was selected

The local Docker CLI is installed, but the local Docker service could not be
started from the current workspace. Local Chromium processes were also closed
by the host execution environment before the data-only smoke test could start.
The implementation therefore fails closed: it does **not** downgrade to the old
direct-network local collector.

GitHub-hosted runners provide a disposable Linux VM and Docker daemon. The same
workflow first builds the two images, verifies the actual container profile,
runs a local no-network semantic smoke test inside the collector image, and only
then starts the six public pages.

## v4 measurement corrections

The v4 contract and implementation correct the fifth-audit issues without
rewriting the frozen v3 artifacts:

1. Stabilization CSS is installed before readiness sampling and excluded from
   stylesheet metrics.
2. Readiness and capture share the same visibility function, including ancestor
   visibility, inert/hidden ancestors and overflow clipping.
3. `section` and `form` become landmarks only when named; top-level header and
   footer rules avoid nested landmark inflation.
4. Interactive counts exclude disabled, `aria-disabled`, inert and negative-
   tabindex controls.
5. Font outputs describe declared stack categories, not the active rendered
   glyph font.
6. CSS lengths use typed `px`, `percent`, `zero`, `keyword` or `other` values;
   `normal` is never silently stored as `0px`.
7. Sibling aggregation is linear-time.
8. A positive allowlist schema rejects unknown or missing payload fields.
9. Browser/context cleanup is protected by `finally` blocks.

## Frozen execution order

1. Push this implementation and manually run the workflow **Option B v4
   isolated six-site pilot** with input `run-1`.
2. Review the uploaded capture, attempt audit and review artifact. At least four
   of six must be technically successful, and every isolation/privacy gate must
   pass.
3. Run `run-2` with the unchanged code **24–72 hours after run 1**.
4. Compare both captures with
   `npm run research:v0.5-option-b-v4-pilot-repeat-compare` and manually review
   the descriptive per-sample drift.
5. Only after that review may one fixed, label-blind **20-site** extension be
   specified. There is no automatic approval.
6. The 81-site run remains prohibited.

## Independent Confirmation decision

The historical independent result remains numerically documented as 82.4%
Precision and 85.7% Recall, but its new status is
`LEGACY_CAPTURE_COMPLETENESS_UNVERIFIABLE`. It is not a current performance
claim in the release manifest, API contract, README or Methodology display.

A fresh independent Confirmation is deliberately deferred. Running it now would
validate a collector and derived-feature definition that are still changing.
The rerun becomes appropriate only after:

- both v4 pilots pass;
- any approved 20-site extension is frozen and reviewed;
- the derived feature contract and model decision rule are frozen on
  Development data;
- no further collector-semantic changes are pending.

## Verification completed locally

- `npm test`: 107/107 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `docker compose ... config --quiet`: passed with required runtime variables.
- GitHub workflow YAML: parsed successfully.
- v4 collector, proxy, reviewer, comparison and fingerprint scripts: syntax and
  unit coverage passed.
- Local container execution: not run because the Docker service is unavailable.
- Local browser smoke execution: host closed the browser process; the workflow
  therefore keeps the smoke test as a mandatory pre-navigation gate inside the
  actual Linux image.

## Primary implementation files

- `.github/workflows/option-b-v4-pilot.yml`
- `infra/option-b-v4/compose.yml`
- `infra/option-b-v4/Dockerfile.collector`
- `infra/option-b-v4/Dockerfile.egress`
- `infra/option-b-v4/egress-proxy.mjs`
- `infra/option-b-v4/seccomp_profile.json`
- `lib/peer-pinned-egress-policy.mjs`
- `lib/option-b-v4-capture.mjs`
- `scripts/run-development-v0_5-option-b-v4-isolated-pilot.mjs`
- `outputs/development_v0_5_option_b_v4/option_b_capture_contract_v4.json`
- `outputs/development_v0_5_option_b_v4/option_b_v4_pilot_manifest.json`

## External references used for the runtime decision

- Playwright Docker guidance recommends a separate non-root user and its
  seccomp profile for crawling untrusted websites:
  https://playwright.dev/docs/docker
- The frozen seccomp profile is from Playwright v1.54.2 commit
  `00ce6a8b72f3845b8b45a3af684391d2eb8a5cef`.
- Artifact upload is pinned to the full SHA for the official
  `actions/upload-artifact` v7.0.1 release:
  `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`.
