import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

import {
  BROWSER_PRELOAD_ROUTE,
  createStaticRendererAssetSource,
  isUnsafeRendererPath,
  matchRendererAsset,
  prepareRendererAssetSource,
  streamAsset,
} from "./rendererAssetSource.js";
import { attachElectronBridge } from "./electronBridge.js";
import { createProjectionManifest } from "./projectionManifest.js";
import { extractVersion, MIN_CODEX_VERSION } from "./version.js";

const HEALTH_CACHE_MS = 1_000;
const SPAWN_TIMEOUT_MS = 3_000;
const NOT_FOUND_BODY = Buffer.from(JSON.stringify({ error: "not_found" }));
const NOT_FOUND_HEADERS = makeHeaders("application/json; charset=utf-8", NOT_FOUND_BODY);
const PRELOAD_PATH = new URL("./browserPreload.js", import.meta.url);

export async function startLocalServer({
  host,
  port,
  cwd,
  codexPath,
  renderer,
  rendererRoot,
  codexAppAsarPath,
  runtimeCacheRoot,
  appServer,
} = {}) {
  const staticRenderer =
    renderer ||
    (rendererRoot
      ? await createStaticRendererAssetSource({ webviewRoot: rendererRoot })
      : await prepareRendererAssetSource({ asarPath: codexAppAsarPath, cacheRoot: runtimeCacheRoot }));
  const healthReader = createHealthReader({ codexPath });
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

      if (request.method === "GET" && url.pathname === "/api/health") {
        const body = Buffer.from(JSON.stringify({ ...healthReader(), renderer: createProjectionManifest(staticRenderer) }, null, 2));
        send(response, 200, makeHeaders("application/json; charset=utf-8", body), body);
        return;
      }

      if ((request.method === "GET" || request.method === "HEAD") && url.pathname === BROWSER_PRELOAD_ROUTE) {
        const preload = await readBrowserPreload();
        send(response, 200, preload.headers, request.method === "HEAD" ? Buffer.alloc(0) : preload.body);
        return;
      }

      if (url.pathname === "/__backend/ipc") {
        const body = Buffer.from(JSON.stringify({ error: "upgrade_required" }));
        send(response, 426, makeHeaders("application/json; charset=utf-8", body), body);
        return;
      }

      if (request.method === "GET" || request.method === "HEAD") {
        if (isUnsafeRendererPath(rawPathname(request.url))) {
          send(response, 404, NOT_FOUND_HEADERS, NOT_FOUND_BODY);
          return;
        }
        const asset = matchRendererAsset(staticRenderer, url.pathname);
        if (!asset) {
          send(response, 404, NOT_FOUND_HEADERS, NOT_FOUND_BODY);
          return;
        }
        if (request.method === "HEAD") {
          send(response, 200, asset.headers, Buffer.alloc(0));
          return;
        }
        streamAsset(response, asset, request.headers);
        return;
      }

      send(response, 404, NOT_FOUND_HEADERS, NOT_FOUND_BODY);
    } catch (error) {
      const body = Buffer.from(JSON.stringify({ error: "server_error", message: String(error?.message ?? error) }));
      send(response, 500, makeHeaders("application/json; charset=utf-8", body), body);
    }
  });
  attachElectronBridge(server, { cwd, codexPath, appServer });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  return server;
}

let browserPreloadAsset = null;

async function readBrowserPreload() {
  if (browserPreloadAsset) return browserPreloadAsset;
  const body = await readFile(PRELOAD_PATH);
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
  browserPreloadAsset = {
    body,
    headers: {
      "cache-control": "no-cache",
      "content-length": String(body.length),
      "content-type": "text/javascript; charset=utf-8",
      etag: `"${hash}"`,
      "x-content-type-options": "nosniff",
    },
  };
  return browserPreloadAsset;
}

function rawPathname(requestUrl = "/") {
  return String(requestUrl).split("?", 1)[0] || "/";
}

function createHealthReader({ codexPath }) {
  let cachedAt = 0;
  let cachedValue = null;
  return () => {
    const now = Date.now();
    if (cachedValue && now - cachedAt < HEALTH_CACHE_MS) {
      return cachedValue;
    }
    cachedValue = readHealth({ codexPath });
    cachedAt = now;
    return cachedValue;
  };
}

function readHealth({ codexPath }) {
  const command = codexPath || "codex";
  const versionResult = runCodex(command, ["--version"]);
  const remoteResult = runCodex(command, ["remote-control", "--help"]);
  const appServerResult = runCodex(command, ["app-server", "--help"]);
  const versionText = `${versionResult.stdout}${versionResult.stderr}`.trim();
  const version = extractVersion(versionText);
  return {
    ok: versionResult.status === 0 && remoteResult.status === 0 && appServerResult.status === 0,
    codex: {
      path: command,
      versionText,
      version,
      minimumVersion: MIN_CODEX_VERSION,
      remoteControlAvailable: remoteResult.status === 0,
      appServerAvailable: appServerResult.status === 0,
      error: versionResult.error || remoteResult.error || appServerResult.error || null,
    },
    server: {
      name: "Codex WebApp",
      mode: "local-first",
    },
  };
}

function runCodex(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: SPAWN_TIMEOUT_MS,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? result.error.message : null,
  };
}

function makeHeaders(contentType, body) {
  return {
    "cache-control": "no-store",
    "content-length": String(body.length),
    "content-type": contentType,
    "x-content-type-options": "nosniff",
  };
}

function send(response, status, headers, body) {
  response.writeHead(status, headers);
  response.end(body);
}
