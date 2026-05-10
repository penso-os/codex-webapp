import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

import { WebSocket } from "ws";

import { startLocalServer } from "../src/localServer.js";

test("local server serves Codex App renderer assets and health endpoint", async () => {
  const rendererRoot = await makeRendererRoot();
  const server = await startLocalServer({
    host: "127.0.0.1",
    port: 0,
    codexPath: "codex",
    rendererRoot,
  });
  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const page = await fetch(`${baseUrl}/`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get("content-type"), "text/html; charset=utf-8");
    assert.match(await page.text(), /Codex renderer fixture/);

    const asset = await fetch(`${baseUrl}/assets/app-main-fixture.css`);
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("cache-control"), "public, max-age=31536000, immutable");
    assert.equal(await asset.text(), "body{color:red}");

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal(health.headers.get("content-type"), "application/json; charset=utf-8");
    const payload = await health.json();
    assert.equal(payload.server.name, "Codex WebApp");
    assert.equal(payload.renderer.engine, "codex-app-renderer-static");
    assert.equal(payload.renderer.fileCount, 2);

    const preload = await fetch(`${baseUrl}/__codex-webapp/browser-preload.js`);
    assert.equal(preload.status, 200);
    assert.equal(preload.headers.get("content-type"), "text/javascript; charset=utf-8");
    assert.match(await preload.text(), /electronBridge/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(path.dirname(rendererRoot), { recursive: true, force: true });
  }
});

test("local server rejects unknown application API routes and path traversal", async () => {
  const rendererRoot = await makeRendererRoot();
  const server = await startLocalServer({
    host: "127.0.0.1",
    port: 0,
    codexPath: "codex",
    rendererRoot,
  });
  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const unknownApi = await fetch(`${baseUrl}/api/local-command`, { method: "POST", body: "{}" });
    assert.equal(unknownApi.status, 404);

    const traversal = await rawGet(address.port, "/%2e%2e/package.json");
    assert.equal(traversal.status, 404);
    assert.deepEqual(JSON.parse(traversal.body), { error: "not_found" });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(path.dirname(rendererRoot), { recursive: true, force: true });
  }
});

test("local server exposes IPC websocket and keeps application mutation routes closed", async () => {
  const rendererRoot = await makeRendererRoot();
  const server = await startLocalServer({
    host: "127.0.0.1",
    port: 0,
    codexPath: "codex",
    rendererRoot,
    appServer: {
      async request(method, params) {
        return { method, params, data: [{ id: "thread-1" }] };
      },
      close() {},
    },
  });
  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const ipc = await fetch(`${baseUrl}/__backend/ipc`);
    assert.equal(ipc.status, 426);
    assert.equal(ipc.headers.get("content-type"), "application/json; charset=utf-8");
    assert.match(await ipc.text(), /upgrade_required/);

    const ws = new WebSocket(`ws://127.0.0.1:${address.port}/__backend/ipc`);
    const messages = collectMessages(ws);
    const firstEvent = await messages.next((message) => message.type === "event");
    assert.equal(firstEvent.type, "event");
    assert.equal(firstEvent.payload.type, "shared-object-updated");
    ws.send(JSON.stringify({
      id: "1",
      kind: "view-message",
      payload: {
        type: "fetch",
        hostId: "local",
        requestId: "fetch-1",
        url: "vscode://codex/active-workspace-roots",
      },
    }));
    assert.equal((await messages.next((message) => message.id === "1")).ok, true);
    const response = await messages.next((message) => message.type === "event" && message.payload.type === "fetch-response");
    assert.equal(response.payload.requestId, "fetch-1");
    assert.match(response.payload.bodyJsonString, /roots/);
    ws.send(JSON.stringify({
      id: "2",
      kind: "view-message",
      payload: {
        type: "mcp-request",
        hostId: "local",
        request: {
          id: "mcp-1",
          method: "thread/list",
          params: { limit: 1 },
        },
      },
    }));
    assert.equal((await messages.next((message) => message.id === "2")).ok, true);
    const mcpResponse = await messages.next((message) => message.type === "event" && message.payload.type === "mcp-response");
    assert.equal(mcpResponse.payload.message.id, "mcp-1");
    assert.equal(mcpResponse.payload.message.result.method, "thread/list");
    assert.deepEqual(mcpResponse.payload.message.result.params, { limit: 1 });
    await closeSocket(ws);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(path.dirname(rendererRoot), { recursive: true, force: true });
  }
});

function collectMessages(ws) {
  const received = [];
  const waiters = [];
  ws.on("message", (data) => {
    const message = JSON.parse(String(data));
    received.push(message);
    for (const waiter of waiters.splice(0)) waiter();
  });
  return {
    async next(predicate) {
      const deadline = Date.now() + 2_000;
      while (Date.now() < deadline) {
        const found = received.find(predicate);
        if (found) return found;
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 25);
          const onError = (error) => {
            clearTimeout(timer);
            reject(error);
          };
          ws.once("error", onError);
          waiters.push(() => {
            ws.off("error", onError);
            clearTimeout(timer);
            resolve();
          });
        });
      }
      throw new Error("Timed out waiting for websocket message");
    },
  };
}

function closeSocket(ws) {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    ws.once("close", resolve);
    ws.close();
  });
}

async function makeRendererRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "codex-webapp-local-server-"));
  const rendererRoot = path.join(root, "webview");
  await mkdir(path.join(rendererRoot, "assets"), { recursive: true });
  await writeFile(
    path.join(rendererRoot, "index.html"),
    '<!doctype html><html><head><link rel="stylesheet" href="/assets/app-main-fixture.css"></head><body>Codex renderer fixture</body></html>',
  );
  await writeFile(path.join(rendererRoot, "assets", "app-main-fixture.css"), "body{color:red}");
  return rendererRoot;
}

function rawGet(port, rawPath) {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: "127.0.0.1",
        method: "GET",
        path: rawPath,
        port,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}
