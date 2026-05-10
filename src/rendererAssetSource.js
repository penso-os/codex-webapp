import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import * as asar from "@electron/asar";

export const DEFAULT_CODEX_APP_ASAR = "/Applications/Codex.app/Contents/Resources/app.asar";
export const DEFAULT_CODEX_APP_PATH = "/Applications/Codex.app";
export const BROWSER_PRELOAD_ROUTE = "/__codex-webapp/browser-preload.js";

export const DEFAULT_RENDERER_CACHE_ROOT = path.join(homedir(), ".cache", "codex-webapp");
const WEBVIEW_PREFIX = "webview/";
const PREPARED_MARKER = ".codex-webapp-renderer.json";
const PREPARED_VERSION = 2;
const MIME_TYPES = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".ttf", "font/ttf"],
  [".wasm", "application/wasm"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

export async function prepareRendererAssetSource({
  asarPath = resolveCodexAppAsarPath(),
  cacheRoot = process.env.CODEX_WEBAPP_RENDERER_CACHE || DEFAULT_RENDERER_CACHE_ROOT,
} = {}) {
  const archive = await inspectAsar(asarPath);
  const fingerprint = rendererFingerprint(archive);
  const runtimeRoot = path.join(cacheRoot, fingerprint);
  const webviewRoot = path.join(runtimeRoot, "webview");
  const markerPath = path.join(runtimeRoot, PREPARED_MARKER);

  if (!(await isPrepared(markerPath, webviewRoot, fingerprint))) {
    await mkdir(runtimeRoot, { recursive: true, mode: 0o700 });
    await chmod(runtimeRoot, 0o700).catch(() => {});
    const stagingRoot = path.join(runtimeRoot, `.staging-${process.pid}-${Date.now()}`);
    await rm(stagingRoot, { recursive: true, force: true });
    await mkdir(stagingRoot, { recursive: true, mode: 0o700 });
    await extractWebviewFiles(archive.path, stagingRoot);
    await transformRendererIndex(stagingRoot);
    await rm(webviewRoot, { recursive: true, force: true });
    await rename(stagingRoot, webviewRoot);
    await writeFile(
      markerPath,
      `${JSON.stringify({ version: PREPARED_VERSION, fingerprint, source: archive.path, preparedAt: new Date().toISOString() })}\n`,
      "utf8",
    );
  }

  return createStaticRendererAssetSource({ webviewRoot, sourceAsar: archive.path, fingerprint });
}

export async function createStaticRendererAssetSource({ webviewRoot, sourceAsar = null, fingerprint = null }) {
  const root = await realpath(webviewRoot);
  const assets = await indexStaticAssets(root);
  const indexAsset = assets.get("index.html");
  if (!indexAsset) {
    throw new Error(`Codex renderer webview is missing index.html: ${root}`);
  }
  return {
    root,
    sourceAsar,
    fingerprint,
    assets,
    indexAsset,
    fileCount: assets.size,
  };
}

export function matchRendererAsset(source, pathname) {
  const key = normalizeRequestPath(pathname);
  if (!key) return null;
  const asset = source.assets.get(key);
  if (asset) return asset;
  if (path.posix.extname(key)) return null;
  return source.indexAsset;
}

export function isUnsafeRendererPath(pathname) {
  return normalizeRequestPath(pathname) === null;
}

export function headersForAsset(asset) {
  return asset.headers;
}

async function inspectAsar(asarPath) {
  let fileStat;
  try {
    fileStat = await stat(asarPath);
  } catch {
    throw new Error(`Codex App renderer archive was not found at ${asarPath}. Install Codex.app or set CODEX_WEBAPP_CODEX_ASAR.`);
  }
  if (!fileStat.isFile()) {
    throw new Error(`Codex App renderer archive is not a file: ${asarPath}`);
  }
  try {
    asar.statFile(asarPath, "webview/index.html");
  } catch {
    throw new Error(`Codex App renderer archive does not contain webview/index.html: ${asarPath}`);
  }
  return {
    path: asarPath,
    sha256: await hashFile(asarPath),
    size: fileStat.size,
    mtimeMs: Math.trunc(fileStat.mtimeMs),
  };
}

function rendererFingerprint({ sha256 }) {
  return sha256;
}

function resolveCodexAppAsarPath() {
  if (process.env.CODEX_WEBAPP_CODEX_ASAR) {
    return process.env.CODEX_WEBAPP_CODEX_ASAR;
  }
  const appPath = process.env.CODEX_APP_PATH || DEFAULT_CODEX_APP_PATH;
  return path.join(appPath, "Contents", "Resources", "app.asar");
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function isPrepared(markerPath, webviewRoot, fingerprint) {
  try {
    const [marker, indexStat, indexHtml] = await Promise.all([
      readFile(markerPath, "utf8"),
      stat(path.join(webviewRoot, "index.html")),
      readFile(path.join(webviewRoot, "index.html"), "utf8"),
    ]);
    const parsed = JSON.parse(marker);
    return indexStat.isFile() && parsed.version === PREPARED_VERSION && parsed.fingerprint === fingerprint && isRendererIndexTransformed(indexHtml);
  } catch {
    return false;
  }
}

async function extractWebviewFiles(asarPath, webviewRoot) {
  const entries = asar.listPackage(asarPath);
  const files = entries
    .map((entry) => entry.replace(/^\/+/, ""))
    .filter((entry) => entry.startsWith(WEBVIEW_PREFIX))
    .filter((entry) => !asar.statFile(asarPath, entry).files);

  for (const entry of files) {
    const relativePath = entry.slice(WEBVIEW_PREFIX.length);
    const target = path.join(webviewRoot, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, asar.extractFile(asarPath, entry));
  }
}

async function transformRendererIndex(webviewRoot) {
  const indexPath = path.join(webviewRoot, "index.html");
  const source = await readFile(indexPath, "utf8");
  const preloadTag = `<script src="${BROWSER_PRELOAD_ROUTE}"></script>`;
  const withoutCsp = source
    .replace(/\s*<meta\s+http-equiv=(["'])Content-Security-Policy\1[^>]*>\s*/i, "\n")
    .replace(new RegExp(`\\s*<script\\s+src=(["'])${escapeRegExp(BROWSER_PRELOAD_ROUTE)}\\1\\s*>\\s*</script>\\s*`, "gi"), "\n");
  const withPreload = withoutCsp.replace(
    /(<script\s+type=(["'])module\2(?=[\s>]))/i,
    `${preloadTag}\n    $1`,
  );
  if (withPreload === withoutCsp) {
    await writeFile(indexPath, withoutCsp.replace(/<\/head>/i, `    ${preloadTag}\n  </head>`), "utf8");
    return;
  }
  await writeFile(indexPath, withPreload, "utf8");
}

function isRendererIndexTransformed(indexHtml) {
  if (/Content-Security-Policy/i.test(indexHtml)) return false;
  const preloadIndex = indexHtml.indexOf(BROWSER_PRELOAD_ROUTE);
  if (preloadIndex === -1) return false;
  const moduleIndex = indexHtml.search(/<script\s+type=(["'])module\1(?=[\s>])/i);
  return moduleIndex === -1 || preloadIndex < moduleIndex;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function indexStaticAssets(root) {
  const assets = new Map();
  await addAssets(root, root, assets);
  return assets;
}

async function addAssets(root, dir, assets) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await addAssets(root, fullPath, assets);
      continue;
    }
    if (!entry.isFile()) continue;
    const fileStat = await stat(fullPath);
    const relativePath = path.relative(root, fullPath).split(path.sep).join("/");
    assets.set(relativePath, {
      path: fullPath,
      relativePath,
      headers: makeStaticHeaders(relativePath, fileStat),
    });
  }
}

function makeStaticHeaders(relativePath, fileStat) {
  const etag = `"${fileStat.size.toString(16)}-${Math.trunc(fileStat.mtimeMs).toString(16)}"`;
  return {
    "cache-control": cacheControlFor(relativePath),
    "content-length": String(fileStat.size),
    "content-type": MIME_TYPES.get(path.extname(relativePath).toLowerCase()) || "application/octet-stream",
    etag,
    "last-modified": fileStat.mtime.toUTCString(),
    "x-content-type-options": "nosniff",
  };
}

function cacheControlFor(relativePath) {
  if (relativePath === "index.html") return "no-cache";
  if (relativePath.startsWith("assets/")) return "public, max-age=31536000, immutable";
  return "public, max-age=3600";
}

function normalizeRequestPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname || "/");
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  if (decoded.split(/[\\/]+/).includes("..")) return null;
  const normalized = path.posix.normalize(`/${decoded}`).replace(/^\/+/, "");
  if (!normalized || normalized === ".") return "index.html";
  if (normalized === ".." || normalized.startsWith("../")) return null;
  return normalized;
}

export function streamAsset(response, asset, requestHeaders = {}) {
  if (requestHeaders["if-none-match"] === asset.headers.etag) {
    response.writeHead(304, {
      "cache-control": asset.headers["cache-control"],
      etag: asset.headers.etag,
      "x-content-type-options": "nosniff",
    });
    response.end();
    return;
  }
  response.writeHead(200, asset.headers);
  createReadStream(asset.path).pipe(response);
}
