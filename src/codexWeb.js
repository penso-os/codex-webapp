export const CODEX_WEB_UPSTREAM = "github:0xcaff/codex-web";
export const CODEX_WEB_COMMIT = "585613f5a3a355af5aefc388ca4e31b07a472cda";
export const CODEX_WEB_REFERENCE = `${CODEX_WEB_UPSTREAM}#${CODEX_WEB_COMMIT}`;
export const DEFAULT_WEB_HOST = "127.0.0.1";
export const DEFAULT_WEB_PORT = 8214;

export function parseStartArgs(args = []) {
  return {
    dryRun: args.includes("--dry-run"),
    yes: args.includes("--yes"),
    allowNonLoopback: args.includes("--allow-non-loopback"),
    host: valueAfter(args, "--host") ?? DEFAULT_WEB_HOST,
    port: Number(valueAfter(args, "--port") ?? valueAfter(args, "--ui-port") ?? DEFAULT_WEB_PORT),
  };
}

export function buildWebUrl({ host = DEFAULT_WEB_HOST, port = DEFAULT_WEB_PORT } = {}) {
  return `http://${host}:${port}/`;
}

export function assertSafeHost(host, { allowNonLoopback = false } = {}) {
  if (allowNonLoopback || isLoopbackHost(host)) return;
  throw new Error(
    "Refusing to bind codex-web to a non-loopback host without --allow-non-loopback. Put Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or an equivalent trusted boundary in front before remote access.",
  );
}

export function buildCodexWebNpxArgs({ host = DEFAULT_WEB_HOST, port = DEFAULT_WEB_PORT } = {}) {
  return [
    "--yes",
    "--package",
    CODEX_WEB_REFERENCE,
    "codex-web",
    "--host",
    host,
    "--port",
    String(port),
  ];
}

export function isLoopbackHost(host) {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}
