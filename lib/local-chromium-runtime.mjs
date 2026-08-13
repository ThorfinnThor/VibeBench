import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const commonPaths = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

export async function resolveLocalChromiumRuntime({ configuredPath = process.env.VIBEBENCH_CHROME_PATH, bundledPath, allowSystem = process.env.VIBEBENCH_ALLOW_SYSTEM_CHROME === "1" } = {}) {
  const candidates = [configuredPath, bundledPath, ...(allowSystem ? commonPaths : [])].filter(Boolean).map((value) => path.resolve(value));
  for (const executable_path of [...new Set(candidates)]) {
    try {
      await access(executable_path, constants.X_OK);
      const version = execFileSync(executable_path, ["--version"], { encoding: "utf8" }).trim();
      const source = configuredPath && path.resolve(configuredPath) === executable_path ? "environment" : bundledPath && path.resolve(bundledPath) === executable_path ? "playwright-bundle" : "system";
      return { executable_path, version, source };
    } catch {
      // Try the next explicitly known local browser path.
    }
  }
  throw new Error("Kein freigegebener lokaler Chromium-Browser gefunden. Zuerst `npm run research:v0.5-option-b-v3-browser-setup` ausführen; alternativ VIBEBENCH_CHROME_PATH explizit setzen.");
}
