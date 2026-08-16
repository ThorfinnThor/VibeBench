# VibeBench Option-B-v4: Run 1 and Early Technical Repeat

Date: 2026-08-16  
Status: **TECHNICALLY STABLE; ACCEPTED WITH AN EXPLICIT TIME-WINDOW WAIVER**

## Outcome

Both isolated six-site workflows completed successfully on the same frozen
source commit. Each run produced five successful captures and one failed
attempt. The same five samples succeeded in both runs, and all per-run review
findings are empty.

The second execution was intentionally started early on user instruction. Its
capture was generated **18.9288 hours** after Run 1, while the frozen protocol
requires **24–72 hours**. The repository comparison therefore returns
`REPEAT_INTEGRITY_REJECTED` solely for the elapsed-time gate. This execution is
retained as an **early technical repeat**. On 2026-08-16 the project owner
explicitly accepted the 18.9288-hour separation as sufficient for the technical
repeat. The machine-readable waiver preserves the original failed time gate and
records the approved consequence separately; it does not rewrite the protocol.

## Immutable execution evidence

| Evidence | Run 1 | Early repeat |
| --- | --- | --- |
| GitHub Actions run | [31891561586](https://github.com/ThorfinnThor/VibeBench/actions/runs/31891561586) | [31940432771](https://github.com/ThorfinnThor/VibeBench/actions/runs/31940432771) |
| Source commit | `77439afec2813df067d4c7783895a9003f37adfa` | `77439afec2813df067d4c7783895a9003f37adfa` |
| Capture generated | `2026-08-15T15:04:44.863Z` | `2026-08-16T10:00:28.650Z` |
| Artifact ID | `9248706274` | `9261884076` |
| Artifact name | `option-b-v4-six-site-run-1` | `option-b-v4-six-site-run-2` |
| Artifact SHA-256 | `372945ade52993b09e7981ebaafe17dc8b8e09f0cc56e40733b1b7e96d5ce191` | `db0762f34348b326ab1fdf51cf71601936b58a79b4a858395f5fbfb207cd13df` |
| Capture SHA-256 | `4cc6428c3a8a57c78834bcfb25ef40dd146710f7bc22859fce311ba164b65c65` | `9d3aba18c3e9eb6787e3092ba236814ac39038e5b724d0bb13766cb6648ec1e0` |
| Attempt-audit SHA-256 | `b09c5946754dd8c06ac9e6280097267e3917f0529b2a64ce3c09248eb2ca9b8f` | `cb0fceed2e20fdc0ed4222421de666098cb7921ff540f4e77d6cab1ed8a16e62` |
| Result | 5 success / 1 failure | 5 success / 1 failure |

The GitHub artifact ZIPs were downloaded again and their local SHA-256 values
matched GitHub's recorded artifact digests exactly.

## Repeat gates

| Gate | Result |
| --- | --- |
| Same manifest and capture contract | Pass |
| Same collector and egress runtime sources | Pass |
| At least four successful captures in each run | Pass (5 and 5) |
| At least four common successful samples | Pass (5) |
| Separation of 24–72 hours | **Fail (18.9288 hours)** |

The five common successful samples were descriptively identical on the two
repeat indicators used by the frozen comparator:

- visible-element delta share: `0` for all five;
- structural-signature Jaccard: `1` for all five.

This is strong technical evidence that the isolated collector is deterministic
on the pilot, but it does not authorize bypassing the frozen time gate.

## Isolation, yield and privacy review

The GitHub workflow passed source tests, deterministic image construction,
container-profile verification, the in-container semantic smoke test,
peer-pinned egress capture, teardown and privacy-minimal artifact upload.

Both review JSON files contain no findings. Both capture files declare that URLs,
raw HTML and text were not persisted and that screenshots were not created. The
attempt audits contain sample IDs and outcome taxonomy only, without target URLs
or hostnames.

## Decision and next gate

The earliest valid official repeat against Run 1 is
`2026-08-16T15:04:44.863Z` (17:04:44 CEST). The latest is
`2026-08-18T15:04:44.863Z` (17:04:44 CEST).

The explicit owner decision accepts the early repeat for the narrow technical
gate and authorizes one fixed, label-blind 20-site extension. The disclosure is
stored in
`development_v0_5_option_b_v4/option_b_v4_repeat_waiver_v1.json`; the raw
comparison remains rejected under the original 24–72-hour rule in
`development_v0_5_option_b_v4/option_b_v4_early_repeat_comparison_v1.json`.

The waiver does not authorize the 81-site run, independent Confirmation, a
model change or any new public performance claim.
