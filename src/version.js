export const MIN_CODEX_VERSION = "0.130.0";

export function extractVersion(text) {
  const match = String(text ?? "").match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match[0] : null;
}

export function compareVersions(left, right) {
  const a = numericParts(left);
  const b = numericParts(right);
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return 1;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return -1;
  }
  return 0;
}

export function isRemoteControlReady(versionText) {
  const version = extractVersion(versionText);
  return Boolean(version && compareVersions(version, MIN_CODEX_VERSION) >= 0);
}

function numericParts(version) {
  const normalized = extractVersion(version);
  if (!normalized) return [0, 0, 0];
  return normalized.split(".").map((part) => Number(part));
}
