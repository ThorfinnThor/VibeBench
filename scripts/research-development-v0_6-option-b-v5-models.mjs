// The model-research entry point deliberately executes the same frozen,
// leakage-safe nested evaluator. There is no alternate shortcut that can tune
// on outer-fold or confirmation labels.
await import("./evaluate-development-v0_6-option-b-v5-grouped.mjs");
