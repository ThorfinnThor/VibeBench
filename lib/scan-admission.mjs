import { createHash } from "node:crypto";

const MAX_ACTIVE_SCANS_PER_INSTANCE = 4;
const MAX_ACTIVE_SCANS_PER_TARGET = 1;
const MAX_SCANS_PER_CLIENT_WINDOW = 20;
const CLIENT_WINDOW_MS = 10 * 60 * 1_000;
const STATE_KEY = Symbol.for("vibebench.scan-admission.v1");

function state() {
  globalThis[STATE_KEY] ||= { active: 0, targets: new Map(), clients: new Map() };
  return globalThis[STATE_KEY];
}

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function scanAdmissionIdentity(request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local-or-unknown";
  const firstAddress = forwarded.split(",", 1)[0].trim().slice(0, 128);
  return hash(firstAddress || "local-or-unknown");
}

export function scanTargetIdentity(url) {
  return hash(new URL(url).hostname.toLowerCase());
}

export function acquireRedirectTargetAdmission({ targetId }) {
  const current = state();
  if ((current.targets.get(targetId) || 0) >= MAX_ACTIVE_SCANS_PER_TARGET) {
    throw new Error("Für diese Website läuft bereits ein Scan.");
  }
  current.targets.set(targetId, (current.targets.get(targetId) || 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const targetCount = (current.targets.get(targetId) || 1) - 1;
    if (targetCount > 0) current.targets.set(targetId, targetCount);
    else current.targets.delete(targetId);
  };
}

export function acquireScanAdmission({ clientId, targetId, now = Date.now() }) {
  const current = state();
  for (const [key, window] of current.clients) {
    if (now - window.startedAt >= CLIENT_WINDOW_MS) current.clients.delete(key);
  }
  const clientWindow = current.clients.get(clientId);
  if (clientWindow && clientWindow.count >= MAX_SCANS_PER_CLIENT_WINDOW) {
    throw new Error("VibeFootprint Scan-Limit erreicht.");
  }
  if (current.active >= MAX_ACTIVE_SCANS_PER_INSTANCE) {
    throw new Error("VibeBench Scan-Kapazität vorübergehend erreicht.");
  }
  const releaseTarget = acquireRedirectTargetAdmission({ targetId });
  if (clientWindow) clientWindow.count += 1;
  else current.clients.set(clientId, { startedAt: now, count: 1 });
  current.active += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    current.active = Math.max(0, current.active - 1);
    releaseTarget();
  };
}

export const SCAN_ADMISSION_LIMITS = Object.freeze({
  active_per_instance: MAX_ACTIVE_SCANS_PER_INSTANCE,
  active_per_target: MAX_ACTIVE_SCANS_PER_TARGET,
  scans_per_client_window: MAX_SCANS_PER_CLIENT_WINDOW,
  client_window_ms: CLIENT_WINDOW_MS
});
