import test from "node:test";
import assert from "node:assert/strict";

import { createAuditEvidenceHook, emitAuditEvidence } from "../src/auditEvidenceHook.js";
import { parseAppServerMessage, serializeAppServerMessage } from "../src/appServerMessageCodec.js";
import {
  bridgeErrorResponse,
  bridgeEvent,
  bridgeResponse,
  parseBridgeFrame,
  serializeBridgeMessage,
} from "../src/bridgeEventEnvelope.js";
import { createProjectionManifest } from "../src/projectionManifest.js";

test("projection manifest preserves the public renderer health shape", () => {
  assert.deepEqual(
    createProjectionManifest({
      fileCount: 3,
      sourceAsar: "/tmp/app.asar",
      root: "/tmp/webview",
    }),
    {
      engine: "codex-app-renderer-static",
      fileCount: 3,
      sourceAsar: "/tmp/app.asar",
      root: "/tmp/webview",
    },
  );
});

test("bridge event envelope parses frames and serializes responses", () => {
  assert.deepEqual(parseBridgeFrame(Buffer.from('{"id":"1","kind":"view-message","payload":{"type":"fetch"}}')), {
    id: "1",
    kind: "view-message",
    payload: { type: "fetch" },
  });
  assert.equal(parseBridgeFrame("{not-json"), null);
  assert.equal(serializeBridgeMessage(bridgeEvent({ type: "ready" })), '{"type":"event","payload":{"type":"ready"}}');
  assert.deepEqual(bridgeResponse("2", { accepted: true }), { id: "2", ok: true, result: { accepted: true } });
  assert.deepEqual(bridgeErrorResponse("3", new Error("bad")), { id: "3", ok: false, error: "bad" });
});

test("app-server message codec keeps newline-delimited JSON separate from browser frames", () => {
  const message = { id: 1, method: "initialize", params: {} };
  assert.equal(serializeAppServerMessage(message), '{"id":1,"method":"initialize","params":{}}\n');
  assert.deepEqual(parseAppServerMessage('{"id":1,"result":{"ok":true}}'), { id: 1, result: { ok: true } });
  assert.equal(parseAppServerMessage("not-json"), null);
});

test("audit evidence hook is optional and does not block bridge flow", async () => {
  const events = [];
  const hook = createAuditEvidenceHook((event) => {
    events.push(event);
    throw new Error("ignored");
  });
  emitAuditEvidence(hook, { type: "bridge-frame" });
  assert.deepEqual(events, []);
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.deepEqual(events, [{ type: "bridge-frame" }]);
  assert.equal(createAuditEvidenceHook(null), null);
});
