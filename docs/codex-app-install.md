# Codex App Web Companion Install UX Guide

Audience: a Codex App user who may not operate a terminal directly.

Codex WebApp is an unofficial companion UI. It is not
affiliated with or endorsed by OpenAI.

This is a prompt-driven npm package path, not a native Codex App marketplace
install. Codex App runs the setup commands for the user.

The intended experience is simple: paste one instruction into Codex App, let
Codex check/install the companion, start the local Codex-style Web surface, and
run a smoke test. For access from another PC or a phone, keep the machine behind
Tailscale, Cloudflare Access, or an equivalent trusted boundary.

## Paste Prompt

Paste this prompt into Codex App:

```text
Please verify Codex WebApp on this machine.

Constraints:
- Treat it as an unofficial companion UI, not an OpenAI-endorsed tool.
- Do not paste or print tokens, cookies, private repository content, customer data, or internal URLs.
- Keep any raw Codex browser server or app-server on localhost or behind Tailscale, Cloudflare Access, or an equivalent trusted boundary.

Steps:
1. Check whether Codex is available and whether `codex remote-control --help` works.
2. If Codex is older than 0.130.0, explain the update that is needed.
3. Run `npx codex-webapp doctor`.
4. Run `npx codex-webapp start --dry-run`.
5. If a UI server is available, run `npx codex-webapp smoke --url http://127.0.0.1:8214/`.
6. Use `--browser --screenshot artifacts/codex-webapp.png` only when browser evidence is needed.
7. Summarize pass/fail status and start a small diagnosis if a step fails.
```

The proof we want is not that a developer can type commands. The proof is that
a Codex App user can paste one instruction, receive a clear readiness result,
and get browser-smoke evidence or a useful failure diagnosis.
