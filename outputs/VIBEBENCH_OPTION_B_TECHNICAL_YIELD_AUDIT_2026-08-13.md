# VibeBench Option-B technical-yield audit

Date: 2026-08-13  
Status: frozen historical audit; no rescans performed

## Result

The frozen Option-B browser collection attempted 169 labelled websites and retained 81 technically usable public-surface scans. Technical yield was 47.9% (95% Wilson interval 40.5–55.4%).

| Outcome | Count |
| --- | ---: |
| Technically usable | 81 |
| Navigation timeout, historical cause unresolved | 81 |
| Browser/client blocked | 3 |
| DNS name unresolved | 3 |
| TLS certificate error | 1 |

The historical collector stored only `navigation_timeout` for 81 failures. It did not retain DNS, HTTP, browser lifecycle or readiness-stage details for those rows. These failures therefore cannot honestly be relabelled as offline, unreachable or blocked after the fact.

## Label-dependent selection

| Label | Attempted | Successful | Technical yield | 95% Wilson interval |
| --- | ---: | ---: | ---: | ---: |
| Strong AI | 83 | 28 | 33.7% | 24.5–44.4% |
| Stable Human | 86 | 53 | 61.6% | 51.1–71.2% |

The absolute yield gap is 27.9 percentage points. A Strong-AI candidate was only 0.55 times as likely to enter the complete-case matrix as a Stable-Human candidate.

This does not prove that technical failure caused the measured model performance, but it establishes a serious label-dependent selection pathway. Precision and Recall on the 81 successful scans describe the successful subset, not all 169 attempted sites.

## Cohort-dependent selection

| Cohort | Attempted | Successful | Technical yield |
| --- | ---: | ---: | ---: |
| Existing | 38 | 37 | 97.4% |
| Expansion | 131 | 44 | 33.6% |

The difference is even larger by acquisition cohort. Eighty-seven of 88 failures occurred in the expansion cohort. The previously observed performance gap between existing and expansion sites must therefore be interpreted together with a very different technical inclusion process.

## Hosting concentration

Thirty failed targets used a `netlify.app` hostname, five used `github.io`, and two used `web.app`. This is acquisition audit metadata only. Hosting suffix, hostname, URL and provenance remain prohibited model features.

## Required correction for future collection

Each navigation attempt must persist one terminal stage and one reason code:

1. input validation;
2. DNS resolution;
3. TCP/TLS connection;
4. HTTP navigation response;
5. DOM readiness;
6. rendered-content eligibility;
7. computed-style extraction;
8. visual extraction;
9. serialization.

Timeouts must record the active stage, elapsed time and whether any document/DOM was observed. A retry must use a fresh browser context and remain linked to the original attempt. Failed rows stay in coverage reporting and must never be converted to a benchmark class prediction.

## Decision

- Keep the 81-site v2 evaluation as complete-case Development research only.
- Do not claim that 169 websites were evaluated by the model.
- Do not rescan opportunistically under the old underspecified collector.
- Freeze the richer capture and failure contract before the next collection.
- Report technical yield by label and acquisition cohort in future benchmark releases.

Machine-readable audit:

- `outputs/development_v0_5_option_b/option_b_technical_yield_audit_v1.json`
