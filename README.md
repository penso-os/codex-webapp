# Codex WebApp

[![CI](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codex-webapp?label=npm)](https://www.npmjs.com/package/codex-webapp)
[![License](https://img.shields.io/npm/l/codex-webapp)](./LICENSE.md)

[English](./README.md) / [日本語](./README.ja.md) / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

**Codex WebApp turns the new `codex remote-control` capability into a local, browser-based Codex surface that Codex App users can start with one pasted instruction.** It is a small, unofficial npm package for people who want the convenience of an app-like UI without giving up the safety of a local-first Codex setup.

Codex `0.130.0` added `codex remote-control` as a simpler entrypoint for starting a headless, remotely controllable app-server.[^1] That is an important foundation, but the CLI release does not by itself give every user a ready-to-use browser or phone-friendly experience. Codex WebApp fills that gap by checking your local Codex installation, starting a pinned browser surface on `localhost`, and verifying that the page actually opened.

![Codex WebApp overview](./docs/assets/codex-webapp-overview.svg)

## Why this exists

Codex is becoming more useful outside a terminal-only workflow. Developers want to keep Codex running on their machine, but review and control it from a browser, a tablet, a phone, or an app-like surface. The goal of this package is therefore not to replace Codex CLI. The goal is to give Codex App users a simple path from **“I heard remote-control is here”** to **“I have a local browser UI running and smoke-tested.”**

| Need | What Codex WebApp provides |
| --- | --- |
| A non-terminal entry point | A pasteable Codex App prompt that lets Codex run the setup steps for you. |
| Confidence before starting | `doctor` checks whether Codex CLI is installed and whether `remote-control` is available. |
| A safe default | The UI binds to `127.0.0.1` by default and refuses non-loopback hosts unless you explicitly opt in. |
| A quick proof that it works | `smoke` verifies the local URL and can capture browser evidence when needed. |
| A thin, inspectable wrapper | The runtime is pinned to a known `codex-web` reference rather than hidden behind a large installer. |

> **Unofficial but respectful.** Codex WebApp is not affiliated with or endorsed by OpenAI. It is designed to stay close to Codex’s local-control model and to avoid telemetry, analytics, browser extensions, or a project-operated phone-home path.

## Quick start from Codex App

If you are using Codex App, paste the following instruction. Codex should perform the checks, run a dry run, start the local UI, and report whether the smoke test passed.

```text
Please set up Codex WebApp on this machine.

Use this npm package:
codex-webapp

Please:
1. Check my Codex version. Codex CLI must be 0.130.0 or newer because this uses `codex remote-control`.
2. Run the package doctor.
3. Run start in dry-run mode first.
4. Start the local browser UI on localhost.
5. Smoke-test the printed local URL.

Do not print tokens, cookies, private repo contents, customer data, or internal URLs.
Keep any raw Codex browser server on localhost unless I have a trusted access boundary such as Tailscale or Cloudflare Access.
```

Codex will normally run commands like the following.

```bash
npx -y codex-webapp doctor
npx -y codex-webapp start --dry-run
npx -y codex-webapp start
```

`npx` runs the published npm package temporarily. You do not need to create a project, clone this repository, or install Codex WebApp by hand just to try it.

## Quick start from a terminal

Use this route if you prefer to control the commands yourself. Codex WebApp requires **Node.js 20 or newer** and **Codex CLI 0.130.0 or newer**.

```bash
npx -y codex-webapp doctor
npx -y codex-webapp start --dry-run
npx -y codex-webapp start
```

By default, the browser UI opens on the local machine at the following URL.

```text
http://127.0.0.1:8214/
```

When the page is running, confirm that the browser surface is reachable.

```bash
npx -y codex-webapp smoke --url http://127.0.0.1:8214/
```

If you need browser evidence for a report or issue, run the browser-backed smoke test and save a screenshot.

```bash
npx -y codex-webapp smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

## What happens under the hood

Codex WebApp is intentionally small. It first verifies that the local `codex` executable exists, checks that its version supports `remote-control`, and confirms that `codex remote-control --help` works. It then starts a pinned Codex-style web surface on a loopback address and gives you a smoke-test command so the setup ends with a concrete pass/fail signal.

| Command | Purpose | Typical result |
| --- | --- | --- |
| `doctor` | Checks Codex CLI, version, and `remote-control` availability. | A readiness summary or a clear update instruction. |
| `start --dry-run` | Shows what would be launched without starting the UI. | A planned local URL and the underlying `npx` command. |
| `start` | Starts the local browser UI after confirmation. | A running UI at `http://127.0.0.1:8214/`. |
| `start --yes` | Starts without the interactive confirmation prompt. | Useful for scripted local setups. |
| `smoke` | Checks whether the UI URL is reachable and contains expected content. | A fast pass/fail result. |
| `smoke --browser --screenshot ...` | Opens the UI in a headless browser and captures evidence. | A screenshot file for debugging or support. |

Current runtime reference:

```text
github:0xcaff/codex-web#585613f5a3a355af5aefc388ca4e31b07a472cda
```

## Safety model

The browser UI is powerful because anyone who can reach it may be able to operate Codex on the host machine. For that reason, Codex WebApp defaults to `127.0.0.1`, refuses non-loopback hosts unless `--allow-non-loopback` is explicitly provided, and prints a confirmation before starting the UI.

| Scenario | Recommended boundary |
| --- | --- |
| Same machine | Keep the default `http://127.0.0.1:8214/`. |
| Phone or another computer you control | Use Tailscale, Cloudflare Access, or an equivalent trusted access layer before exposing anything beyond localhost. |
| Public internet | Do not expose the raw UI server directly on a public IP. |
| Support issue | Redact tokens, cookies, private repository contents, customer data, and internal URLs before sharing logs. |

Codex WebApp does not include telemetry, analytics, a browser extension, or a project-operated phone-home path. It also does not store browser tokens in extension storage because it does not install an extension.

## Requirements

| Requirement | Version or note |
| --- | --- |
| Codex CLI | `0.130.0` or newer, because `codex remote-control` is required. |
| Node.js | `20` or newer. |
| Network binding | `127.0.0.1` by default. Non-loopback hosts require explicit opt-in. |
| Package channel | `codex-webapp` from the npm `latest` channel. Current release: `0.1.1`. |

If Codex is missing or too old, update it first.

```bash
npm install -g @openai/codex@latest
codex --version
codex remote-control --help
```

## Troubleshooting

Most setup failures fall into a small number of categories. Run the commands in this order and share only redacted output if you open an issue.

| Symptom | First check | Likely next step |
| --- | --- | --- |
| `Codex CLI was not found` | `codex --version` | Install or update Codex CLI. |
| `remote-control` is unavailable | `codex remote-control --help` | Upgrade to Codex CLI `0.130.0` or newer. |
| The UI does not open | `npx -y codex-webapp start --dry-run` | Check whether the port is available and whether the launch command is correct. |
| The smoke test fails | `npx -y codex-webapp smoke --url http://127.0.0.1:8214/` | Confirm the server is still running and that you are using the printed URL. |
| You need proof for debugging | `smoke --browser --screenshot artifacts/codex-webapp.png` | Attach the screenshot and redacted logs to an issue. |

## Development

```bash
npm test
npm pack --dry-run
npm run start:dry-run
```

## Support

Open an issue with your OS, shell, Node version, Codex version, the command you ran, and redacted output from `doctor`, `start`, or `smoke`. Do not paste tokens, cookies, private repository contents, customer data, or internal URLs into a public issue.

See [SECURITY.md](./SECURITY.md), [SUPPORT.md](./SUPPORT.md), and [ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md) for additional guidance.

## License

[Apache-2.0](./LICENSE.md)

## References

[^1]: [openai/codex Releases: 0.130.0](https://github.com/openai/codex/releases/tag/rust-v0.130.0) states that `codex remote-control` was added as a simpler entrypoint for starting a headless, remotely controllable app-server.
