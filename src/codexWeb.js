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
    "Refusing to bind Codex WebApp to a non-loopback host without --allow-non-loopback. Put Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or an equivalent trusted boundary in front before remote access.",
  );
}

export function buildLocalServerSummary({ host = DEFAULT_WEB_HOST, port = DEFAULT_WEB_PORT } = {}) {
  return {
    host,
    port,
    url: buildWebUrl({ host, port }),
    runtime: "package-owned Codex App renderer bridge",
  };
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
