(function () {
  const APP_SESSION_ID = "codex-webapp-browser-session";
  const REQUEST_TIMEOUT_MS = 10_000;
  const sharedObjects = new Map([
    ["host_config", { id: "local", display_name: "Local", kind: "local" }],
    ["remote_connections", []],
    ["remote_control_connections", []],
  ]);
  const pending = new Map();
  const queue = [];
  let nextId = 1;
  let socket = null;
  let socketOpen = false;
  const nativeFetch = window.fetch?.bind(window);

  if (nativeFetch) {
    window.fetch = function codexWebappFetch(input, init) {
      const url = typeof input === "string" ? input : input?.url;
      if (String(url || "").startsWith("sentry-ipc://")) {
        return Promise.resolve(new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }));
      }
      return nativeFetch(input, init);
    };
  }

  function connect() {
    if (socket) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(`${protocol}//${window.location.host}/__backend/ipc`);
    socket.addEventListener("open", () => {
      socketOpen = true;
      while (queue.length > 0) socket.send(queue.shift());
    });
    socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message && message.id && pending.has(message.id)) {
        const deferred = pending.get(message.id);
        pending.delete(message.id);
        clearTimeout(deferred.timer);
        if (message.ok === false) {
          deferred.reject(new Error(message.error || "Codex WebApp IPC request failed"));
          return;
        }
        deferred.resolve(message.result);
        return;
      }
      if (message && message.type === "event") {
        receiveFromHost(message.payload);
      }
    });
    socket.addEventListener("close", () => {
      socketOpen = false;
      socket = null;
    });
  }

  function request(kind, payload) {
    connect();
    const id = String(nextId++);
    const frame = JSON.stringify({ id, kind, payload });
    if (socketOpen && socket?.readyState === WebSocket.OPEN) {
      socket.send(frame);
    } else {
      queue.push(frame);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Codex WebApp IPC timed out: ${kind}`));
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
    });
  }

  function receiveFromHost(payload) {
    if (!payload || typeof payload !== "object") return;
    if (payload.type === "shared-object-updated" && payload.key) {
      sharedObjects.set(payload.key, payload.value);
    }
    window.dispatchEvent(new MessageEvent("message", {
      data: payload,
      origin: window.location.origin,
      source: window,
    }));
  }

  function sendMessageFromView(message) {
    if (message?.type === "shared-object-set" && message.key) {
      sharedObjects.set(message.key, message.value);
      receiveFromHost({ type: "shared-object-updated", key: message.key, value: message.value });
    }
    return request("view-message", message).catch(() => undefined);
  }

  function sendWorkerMessageFromView(workerId, message) {
    return request("worker-message", { workerId, message }).catch(() => undefined);
  }

  function subscribeToWorkerMessages(workerId, callback) {
    const handler = (event) => {
      const message = event.data;
      if (message?.type === `codex_desktop:worker:${workerId}:for-view`) {
        callback(message.payload);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }

  function getSystemThemeVariant() {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  function subscribeToSystemThemeVariant(callback) {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return () => {};
    const listener = () => callback(getSystemThemeVariant());
    query.addEventListener?.("change", listener);
    return () => query.removeEventListener?.("change", listener);
  }

  window.codexWindowType = "electron";
  window.electronBridge = {
    windowType: "electron",
    sendMessageFromView,
    getPathForFile(file) {
      return file?.path || file?.name || "";
    },
    sendWorkerMessageFromView,
    subscribeToWorkerMessages,
    showContextMenu(options) {
      return request("show-context-menu", options).catch(() => null);
    },
    showApplicationMenu(options) {
      return request("show-application-menu", options).catch(() => null);
    },
    getFastModeRolloutMetrics() {
      return Promise.resolve(null);
    },
    getSharedObjectSnapshotValue(key) {
      return sharedObjects.get(key);
    },
    getSystemThemeVariant,
    subscribeToSystemThemeVariant,
    triggerSentryTestError() {
      throw new Error("Codex WebApp browser Sentry test");
    },
    getSentryInitOptions() {
      return {
        appVersion: "0.0.0",
        buildFlavor: "prod",
        buildNumber: "0",
        dsn: null,
        environment: "browser",
        codexAppSessionId: APP_SESSION_ID,
        release: null,
      };
    },
    getAppSessionId() {
      return APP_SESSION_ID;
    },
    getBuildFlavor() {
      return "prod";
    },
  };

  connect();
})();
