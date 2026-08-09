# VibeBench URL Evaluation Methodology v0.9

A single accuracy number is not enough.

## 1. Full model

Includes direct builder fingerprints.

This answers:

> Can we identify AI-built sites when deployment artifacts survive?

Useful in production, but it can overstate generalization.

## 2. Portable model

Removes:

- `builder_*`
- `hosting_*`
- hosting/provider headers
- `data-component-id`
- traditional builder-specific technology flags

This answers:

> Is there signal beyond explicit builder/hosting fingerprints?

## 3. Structure model

Additionally removes `tech_*` framework/library flags.

This is a hard stress test of DOM/assets/SEO/layout statistics.

## 4. Leave-one-builder-out

For each AI builder with enough successful samples:

1. remove every site from that builder from training,
2. train on other AI builders plus grouped Human controls,
3. test on the unseen builder plus held-out Human domains.

This is the critical defense against a misleading result such as:

> “The model gets 95% accuracy because it learned lovable.app.”

## Reporting

Always publish all three modes and builder-holdout results.

A credible product should clearly distinguish:

- direct builder attribution,
- general AI-development probability,
- uncertainty / indeterminate cases.
