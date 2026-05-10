import { homedir } from "node:os";
import path from "node:path";

import { WebSocketServer } from "ws";

import { createAuditEvidenceHook, emitAuditEvidence } from "./auditEvidenceHook.js";
import { CodexAppServerBridge } from "./appServerBridge.js";
import {
  bridgeErrorResponse,
  bridgeEvent,
  bridgeResponse,
  parseBridgeFrame,
  serializeBridgeMessage,
} from "./bridgeEventEnvelope.js";

const DEFAULT_HOST_CONFIG = { id: "local", display_name: "Local", kind: "local" };
const DEBUG_BRIDGE = process.env.CODEX_WEBAPP_DEBUG_BRIDGE === "1";

export function attachElectronBridge(server, { cwd = process.cwd(), codexPath = "codex", appServer = null, auditEvidence = null } = {}) {
  const wss = new WebSocketServer({ noServer: true });
  const state = createBridgeState({ cwd, codexPath, appServer, auditEvidence });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
    if (url.pathname !== "/__backend/ipc") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    sendInitialState(ws, state);
    ws.on("message", (data) => {
      handleFrame(ws, state, data).catch((error) => {
        debug("frame error", { error: String(error?.message ?? error) });
      });
    });
  });

  const closeHttpServer = server.close.bind(server);
  server.close = (callback) => {
    for (const client of wss.clients) {
      client.close();
    }
    wss.close(() => {
      state.appServer?.close?.();
      closeHttpServer(callback);
    });
    return server;
  };

  return { wss, state };
}

function createBridgeState({ cwd, codexPath, appServer, auditEvidence }) {
  const workspaceRoot = path.resolve(cwd || process.cwd());
  return {
    cwd: workspaceRoot,
    auditEvidenceHook: createAuditEvidenceHook(auditEvidence),
    appServer:
      appServer ||
      new CodexAppServerBridge({
        codexPath,
        cwd: workspaceRoot,
        onNotification: (message) => {
          debug("app-server notification", { method: message.method });
        },
      }),
    sharedObjects: new Map([
      ["host_config", DEFAULT_HOST_CONFIG],
      ["remote_connections", []],
      ["remote_control_connections", []],
      ["active_workspace_root", workspaceRoot],
    ]),
  };
}

function sendInitialState(ws, state) {
  for (const [key, value] of state.sharedObjects.entries()) {
    sendEvent(ws, state, { type: "shared-object-updated", key, value });
  }
}

async function handleFrame(ws, state, data) {
  const frame = parseBridgeFrame(data);
  if (!frame) return;
  const { id, kind, payload } = frame || {};
  debug("frame", { id, kind, payloadType: payload?.type, url: payload?.url });
  emitAuditEvidence(state.auditEvidenceHook, { type: "bridge-frame", kind, payloadType: payload?.type });
  try {
    const result = await handleRequest(ws, state, kind, payload);
    if (id) sendJson(ws, bridgeResponse(id, result));
  } catch (error) {
    if (id) sendJson(ws, bridgeErrorResponse(id, error));
  }
}

async function handleRequest(ws, state, kind, payload) {
  if (kind === "view-message") {
    await handleViewMessage(ws, state, payload);
    return { accepted: true };
  }
  if (kind === "worker-message") {
    return { accepted: true };
  }
  return null;
}

async function handleViewMessage(ws, state, message) {
  if (!message || typeof message !== "object") return;
  if (message.type === "mcp-request") {
    await sendMcpResponse(ws, state, message);
    return;
  }
  if (message.type === "fetch") {
    sendFetchResponse(ws, state, message);
    return;
  }
  if (message.type === "shared-object-subscribe" && message.key) {
    sendEvent(ws, state, { type: "shared-object-updated", key: message.key, value: state.sharedObjects.get(message.key) });
    return;
  }
  if (message.type === "shared-object-set" && message.key) {
    state.sharedObjects.set(message.key, message.value);
    sendEvent(ws, state, { type: "shared-object-updated", key: message.key, value: message.value });
    return;
  }
  if (message.type === "persisted-atom-sync-request") {
    sendEvent(ws, state, { type: "persisted-atom-sync", state: persistedAtomState() });
    return;
  }
  if (message.type === "persisted-atom-update") {
    sendEvent(ws, state, { type: "persisted-atom-updated", key: message.key, value: message.value, deleted: message.deleted });
  }
}

async function sendMcpResponse(ws, state, message) {
  const request = message.request;
  if (!request || typeof request !== "object") return;
  const response = await responseForMcpRequest(state, request);
  sendEvent(ws, state, {
    type: "mcp-response",
    hostId: message.hostId || "local",
    message: response,
    response,
  });
}

async function responseForMcpRequest(state, request) {
  try {
    const result = await state.appServer.request(request.method, request.params || {});
    return { id: request.id, result };
  } catch (error) {
    return {
      id: request.id,
      error: {
        code: -32000,
        message: String(error?.message ?? error),
      },
    };
  }
}

function sendFetchResponse(ws, state, request) {
  const endpoint = parseCodexEndpoint(request.url);
  debug("fetch", { endpoint, requestId: request.requestId });
  const body = responseForEndpoint(endpoint, state, request);
  sendEvent(ws, state, {
    type: "fetch-response",
    hostId: request.hostId || "local",
    requestId: request.requestId,
    responseType: "success",
    status: 200,
    headers: { "content-type": "application/json" },
    bodyJsonString: JSON.stringify(body),
  });
}

function parseCodexEndpoint(url) {
  const raw = String(url || "");
  if (raw.startsWith("vscode://codex/")) {
    return raw.slice("vscode://codex/".length).replace(/^\/+/, "");
  }
  try {
    return new URL(raw, "http://localhost").pathname.replace(/^\/+/, "");
  } catch {
    return raw.replace(/^\/+/, "");
  }
}

function responseForEndpoint(endpoint, state, request) {
  switch (endpoint) {
    case "active-workspace-roots":
      return { roots: [state.cwd] };
    case "workspace-root-options":
      return {
        roots: [state.cwd],
        options: [{ path: state.cwd, label: path.basename(state.cwd) || state.cwd }],
      };
    case "workspace-directory-entries":
      return { workspaceRoot: state.cwd, entries: [] };
    case "codex-home":
      return { path: process.env.CODEX_HOME || path.join(homedir(), ".codex") };
    case "git-origins":
      return { origins: [] };
    case "get-global-state":
      return { value: globalStateValue(parseBody(request.body)?.key) };
    case "list-pinned-threads":
      return { threadIds: [] };
    case "extension-info":
      return { version: "0.0.0", appName: "Codex" };
    case "os-info":
      return { platform: process.platform, arch: process.arch, homedir: homedir() };
    case "is-copilot-api-available":
      return { available: false };
    case "user-saved-config":
      return { config: {}, configWriteTarget: null };
    case "codex-command-keymap-state":
      return { bindings: [] };
    case "get-configuration":
      return { value: configurationValue(parseBody(request.body)?.key) };
    case "list-automations":
      return { items: [] };
    case "paths-exist":
      return { paths: [], results: [] };
    case "browser-use-origin-state-read":
      return { allowed: false };
    case "ambient-suggestions":
      return { suggestions: [] };
    case "ide-context":
      return { items: [] };
    case "hooks/list":
      return { data: [{ cwd: state.cwd, hooks: [] }] };
    case "skills/list":
      return { data: [] };
    case "wham/tasks/list":
      return { tasks: [] };
    case "wham/usage":
      return { usage: null };
    case "chrome-native-host-install":
    case "chrome-native-host-uninstall":
      return { ok: true };
    case "ipc-request":
      return handleNestedIpcRequest(state, request);
    default:
      return {};
  }
}

function configurationValue(key) {
  switch (key) {
    case "runCodexInWindowsSubsystemForLinux":
      return false;
    case "conversationDetailMode":
      return "expanded";
    case "followUpQueueMode":
      return "off";
    default:
      return null;
  }
}

function globalStateValue(key) {
  switch (key) {
    case "projectless-thread-ids":
    case "sidebar-chat-thread-order":
    case "thread-workspace-root-hints":
      return [];
    case "sidebar-project-thread-orders":
      return {};
    case "use-copilot-auth-if-available":
      return false;
    default:
      return null;
  }
}

function persistedAtomState() {
  return {
    "codex-command-keymap-state": { bindings: [] },
    "statsig_default_enable_features": { memories: false, realtime_conversation: false },
  };
}

function handleNestedIpcRequest(state, request) {
  const body = parseBody(request.body);
  const channel = body?.channel || body?.type || "";
  if (channel === "codex_desktop:get-system-theme-variant") return "light";
  if (channel === "codex_desktop:get-build-flavor") return "prod";
  if (channel === "codex_desktop:get-sentry-init-options") return { dsn: null, environment: "browser" };
  if (channel === "codex_desktop:get-fast-mode-rollout-metrics") return null;
  if (channel === "active-workspace-roots") return { roots: [state.cwd] };
  return null;
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === "object") return body;
  try {
    return JSON.parse(String(body));
  } catch {
    return null;
  }
}

function sendEvent(ws, state, payload) {
  emitAuditEvidence(state?.auditEvidenceHook, { type: "bridge-event", payloadType: payload?.type });
  sendJson(ws, bridgeEvent(payload));
}

function sendJson(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(serializeBridgeMessage(message));
  }
}

function debug(label, value) {
  if (DEBUG_BRIDGE) {
    console.error(`[codex-webapp bridge] ${label}`, JSON.stringify(value));
  }
}
