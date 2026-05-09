import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { parseSmokeArgs, runHttpSmoke } from "../src/browserSmoke.js";

test("parseSmokeArgs uses a helpful default codex remote URL", () => {
  assert.deepEqual(parseSmokeArgs([]), {
    url: "http://127.0.0.1:8214/",
    text: "What should we build",
    timeoutMs: 10_000,
    maxResponseMs: 5_000,
    browser: false,
    screenshot: undefined,
  });
});

test("parseSmokeArgs accepts url, text, timeout, and screenshot", () => {
  assert.deepEqual(
    parseSmokeArgs([
      "--url",
      "http://127.0.0.1:4173/codex-remote/",
      "--text",
      "Remote Console",
      "--timeout-ms",
      "20000",
      "--max-response-ms",
      "3000",
      "--browser",
      "--screenshot",
      "artifacts/smoke.png",
    ]),
    {
      url: "http://127.0.0.1:4173/codex-remote/",
      text: "Remote Console",
      timeoutMs: 20_000,
      maxResponseMs: 3_000,
      browser: true,
      screenshot: "artifacts/smoke.png",
    },
  );
});

test("parseSmokeArgs treats screenshot as browser evidence request", () => {
  assert.equal(parseSmokeArgs(["--screenshot", "out.png"]).browser, true);
});

test("runHttpSmoke verifies a reachable codex-web style page without Playwright", async () => {
  const server = await startFixtureServer("What should we build today?");
  try {
    await runHttpSmoke(["--url", server.url, "--timeout-ms", "5000"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

function startFixtureServer(body) {
  return new Promise((resolve) => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<html><body>${body}</body></html>`);
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        close: (callback) => server.close(callback),
        url: `http://127.0.0.1:${address.port}/`,
      });
    });
  });
}
