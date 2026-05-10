import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

import * as asar from "@electron/asar";

import {
  BROWSER_PRELOAD_ROUTE,
  DEFAULT_CODEX_APP_PATH,
  DEFAULT_RENDERER_CACHE_ROOT,
  createStaticRenderer,
  matchRendererAsset,
  prepareCodexAppRenderer,
} from "../src/codexAppRenderer.js";

test("default renderer cache lives under the user cache directory", () => {
  assert.equal(DEFAULT_RENDERER_CACHE_ROOT, path.join(homedir(), ".cache", "codex-webapp"));
  assert.equal(DEFAULT_CODEX_APP_PATH, "/Applications/Codex.app");
});

test("createStaticRenderer indexes assets with stable cache headers", async () => {
  const rendererRoot = await makeRendererRoot("static-renderer");
  try {
    const renderer = await createStaticRenderer({ webviewRoot: rendererRoot });
    assert.equal(renderer.fileCount, 2);
    assert.equal(matchRendererAsset(renderer, "/").relativePath, "index.html");
    assert.equal(matchRendererAsset(renderer, "/missing/deep/link").relativePath, "index.html");
    assert.equal(matchRendererAsset(renderer, "/%2e%2e/package.json"), null);

    const css = matchRendererAsset(renderer, "/assets/app-main-fixture.css");
    assert.equal(css.headers["content-type"], "text/css; charset=utf-8");
    assert.equal(css.headers["cache-control"], "public, max-age=31536000, immutable");
    assert.match(css.headers.etag, /^"/);
  } finally {
    await rm(path.dirname(rendererRoot), { recursive: true, force: true });
  }
});

test("prepareCodexAppRenderer extracts only the webview tree from a local asar", async () => {
  const sourceRoot = await makeRendererRoot("asar-source");
  const archiveRoot = path.dirname(sourceRoot);
  const archiveOut = await mkdtemp(path.join(tmpdir(), "codex-webapp-asar-out-"));
  const archivePath = path.join(archiveOut, "app.asar");
  const cacheRoot = await mkdtemp(path.join(tmpdir(), "codex-webapp-renderer-cache-"));

  try {
    await writeFile(path.join(archiveRoot, "main-process-only.txt"), "not served");
    await asar.createPackage(archiveRoot, archivePath);

    const renderer = await prepareCodexAppRenderer({ asarPath: archivePath, cacheRoot });
    assert.equal(renderer.fileCount, 2);
    assert.match(renderer.fingerprint, /^[a-f0-9]{64}$/);
    assert.equal(path.dirname(path.dirname(renderer.root)), await realpath(cacheRoot));
    const indexHtml = await readFile(path.join(renderer.root, "index.html"), "utf8");
    assert.doesNotMatch(indexHtml, /Content-Security-Policy/i);
    assert.match(indexHtml, new RegExp(BROWSER_PRELOAD_ROUTE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(indexHtml, /Codex renderer fixture/);
    assert.equal(matchRendererAsset(renderer, "/main-process-only.txt"), null);
  } finally {
    await rm(archiveRoot, { recursive: true, force: true });
    await rm(archiveOut, { recursive: true, force: true });
    await rm(cacheRoot, { recursive: true, force: true });
  }
});

async function makeRendererRoot(label) {
  const root = await mkdtemp(path.join(tmpdir(), `codex-webapp-${label}-`));
  const rendererRoot = path.join(root, "webview");
  await mkdir(path.join(rendererRoot, "assets"), { recursive: true });
  await writeFile(
    path.join(rendererRoot, "index.html"),
    `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'self'"><script type="module" src="./assets/index.js"></script></head><body>Codex renderer fixture</body></html>`,
  );
  await writeFile(path.join(rendererRoot, "assets", "app-main-fixture.css"), "body{color:red}");
  return rendererRoot;
}
