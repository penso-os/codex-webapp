import { spawn } from "node:child_process";

const REQUEST_TIMEOUT_MS = 30_000;
const CLIENT_INFO = {
  name: "codex-webapp",
  title: "Codex WebApp",
  version: "0.1.8",
};

export class CodexAppServerBridge {
  constructor({
    codexPath = "codex",
    cwd = process.cwd(),
    env = process.env,
    timeoutMs = REQUEST_TIMEOUT_MS,
    onNotification = null,
  } = {}) {
    this.codexPath = codexPath || "codex";
    this.cwd = cwd || process.cwd();
    this.env = env;
    this.timeoutMs = timeoutMs;
    this.onNotification = onNotification;
    this.process = null;
    this.buffer = "";
    this.nextId = 1;
    this.pending = new Map();
    this.startPromise = null;
    this.closed = false;
  }

  async request(method, params = {}) {
    await this.ensureStarted();
    return await this.sendRequest(method, params);
  }

  async ensureStarted() {
    if (this.startPromise) return await this.startPromise;
    this.startPromise = this.start();
    return await this.startPromise;
  }

  async start() {
    if (this.closed) throw new Error("Codex app-server bridge is closed");
    this.process = spawn(this.codexPath, ["app-server", "--listen", "stdio://"], {
      cwd: this.cwd,
      env: this.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.process.stdout.setEncoding("utf8");
    this.process.stderr.setEncoding("utf8");
    this.process.stdout.on("data", (chunk) => this.receiveStdout(chunk));
    this.process.once("exit", (code, signal) => {
      const exitStatus = signal || (code ?? "unknown");
      const error = new Error(`codex app-server exited (${exitStatus})`);
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
      this.process = null;
      this.startPromise = null;
    });

    const stderr = [];
    this.process.stderr.on("data", (chunk) => {
      stderr.push(String(chunk));
      if (stderr.join("").length > 16_384) stderr.shift();
    });

    try {
      await this.sendRequest("initialize", {
        clientInfo: CLIENT_INFO,
        capabilities: { experimentalApi: true },
      });
      this.sendNotification("initialized", {});
    } catch (error) {
      throw new Error(`failed to initialize codex app-server: ${error.message}; ${stderr.join("").trim()}`);
    }
  }

  sendRequest(method, params = {}) {
    const id = this.nextId++;
    this.write({ id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`timed out waiting for codex app-server response: ${method}`));
      }, this.timeoutMs);
      this.pending.set(id, { method, resolve, reject, timer });
    });
  }

  sendNotification(method, params = {}) {
    this.write({ method, params });
  }

  write(message) {
    if (!this.process?.stdin?.writable) {
      throw new Error("codex app-server stdin is not writable");
    }
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  receiveStdout(chunk) {
    this.buffer += chunk;
    let newlineIndex;
    while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (!line.trim()) continue;
      this.receiveLine(line);
    }
  }

  receiveLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.id && this.pending.has(message.id)) {
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) {
        pending.reject(new Error(errorMessage(message.error)));
        return;
      }
      pending.resolve(message.result ?? {});
      return;
    }
    if (message.method && this.onNotification) {
      this.onNotification(message);
    }
  }

  close() {
    this.closed = true;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Codex app-server bridge closed"));
    }
    this.pending.clear();
    if (this.process && this.process.exitCode === null) {
      this.process.kill();
    }
    this.process = null;
  }
}

function errorMessage(error) {
  if (!error || typeof error !== "object") return String(error);
  return error.message || JSON.stringify(error);
}
