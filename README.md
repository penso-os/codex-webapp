# Codex WebApp

[![CI](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codex-webapp?label=npm)](https://www.npmjs.com/package/codex-webapp)
[![License](https://img.shields.io/npm/l/codex-webapp)](./LICENSE.md)

[English](./README.md) / [日本語](./README.ja.md) / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

**Codex WebApp is an unofficial, local-first renderer bridge for Codex App users.** It reads the installed Codex App renderer from `/Applications/Codex.app/Contents/Resources/app.asar`, extracts only the `webview/` tree into `~/.cache/codex-webapp/`, serves that renderer on `127.0.0.1`, and gives you a repeatable smoke test.

![Codex WebApp flow](./docs/assets/codex-webapp-overview.svg)

## Quick Start From Codex App

Paste this into Codex App:

```text
Please start Codex WebApp on this computer.

This is an unofficial local renderer bridge for Codex App users.
Do not print tokens, cookies, private repository contents, customer data, internal URLs, `.env` values, or anything containing SECRET, KEY, or TOKEN.

Please do this in order:

1. Check `node -v`, `npm -v`, and `npx -v`.
2. Run `npx -y codex-webapp@latest doctor`.
3. If doctor fails, stop and explain the fix.
4. Run `npx -y codex-webapp@latest start --dry-run`.
5. If the dry run looks good, run `npx -y codex-webapp@latest start`.
6. When it starts, tell me to open `http://127.0.0.1:8214/`.
7. Explain that closing this terminal stops the page, and that after a computer restart I need to run start again.

For phone or remote access, do not expose the raw UI server directly to a public IP. Use Tailscale, Cloudflare Access, or an equivalent trusted access boundary.
```

Codex will usually run:

```bash
npx -y codex-webapp@latest doctor
npx -y codex-webapp@latest start --dry-run
npx -y codex-webapp@latest start
```

## Terminal Quick Start

```bash
npx -y codex-webapp doctor
npx -y codex-webapp start --dry-run
npx -y codex-webapp start
```

Then open:

```text
http://127.0.0.1:8214/
```

Verify the page:

```bash
npx -y codex-webapp smoke --url http://127.0.0.1:8214/
```

For screenshot evidence:

```bash
npx -y codex-webapp smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

## What It Runs

`codex-webapp start` starts the local renderer bridge shipped by this package. The bridge prepares the Codex App webview from the Codex App already installed on this Mac, caches the extracted renderer under `~/.cache/codex-webapp/`, and serves those static files with cache headers. It does not bundle another runtime, does not start a hosted service, and does not phone home.

This package is the adapter, not Codex App itself. It does not bundle Codex/OpenAI binaries, `app.asar`, a pre-extracted `webview/`, tokens, cookies, signed URLs, private session databases, private repository contents, or customer data. At runtime it reads the user's locally installed Codex App, extracts only `webview/` into the user's local cache, and serves that local copy.

| Command | Purpose |
| --- | --- |
| `doctor` | Checks Codex CLI, version, and `remote-control` availability. |
| `start --dry-run` | Shows the planned local URL without starting the server. |
| `start` | Prepares and serves the installed Codex App renderer. |
| `start --yes` | Starts without an interactive confirmation prompt. |
| `smoke` | Checks that the local UI URL responds with expected content. |
| `smoke --browser --screenshot ...` | Opens the page in a browser and saves evidence. |

For a developer-friendly overview of the adapter boundary, see [Architecture](./docs/architecture.md).

## Safety Model

The UI is powerful because anyone who can reach it may be able to operate Codex on the host machine. Codex WebApp therefore defaults to `127.0.0.1`, refuses non-loopback hosts unless `--allow-non-loopback` is provided, and prints a confirmation before starting.

Do not expose the raw UI server on a public IP. For phone or remote access, put Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or an equivalent trusted boundary in front first.

Codex WebApp does not include telemetry, analytics, a browser extension, or a project-operated phone-home path.

## It Only Works While The Process Is Running

Codex WebApp is not a hosted cloud service. The browser UI exists only while `npx -y codex-webapp start` is running on your computer.

| Event | Result | Fix |
| --- | --- | --- |
| You close the terminal window | The UI stops. | Run `npx -y codex-webapp start` again. |
| The computer sleeps | The connection may break. | Restart the command if the page stops opening. |
| The computer restarts | The process is gone. | Run `npx -y codex-webapp start` again after rebooting. |
| You want phone access | `127.0.0.1` only works on the same computer. | Add a trusted access boundary first. |

## Requirements

| Requirement | Version or note |
| --- | --- |
| Codex CLI | `0.130.0` or newer. |
| Codex App | macOS app installed at `/Applications/Codex.app`. |
| Node.js | `20.11` or newer. |
| Binding | `127.0.0.1` by default. |
| Package | `codex-webapp` from npm. |

If Codex is missing or too old:

```bash
npm install -g @openai/codex@latest
codex --version
codex remote-control --help
```

If Codex App is missing from the default location, install it first, set `CODEX_APP_PATH` to the local `Codex.app`, or point `CODEX_WEBAPP_CODEX_ASAR` at a local `app.asar`. The package extracts only `webview/` at runtime; renderer files from Codex App are not included in this package.

To remove the local renderer cache, delete `~/.cache/codex-webapp/`. It will be prepared again the next time `start` runs.

## Development

```bash
npm test
npm pack --dry-run
npm run start:dry-run
npm run verify:clean-release
```

Before release handoff, run the clean release gate and attach redacted evidence. See [Clean Release Verification](./docs/clean-release-verification.md).

## Support

Open an issue with your OS, shell, Node version, Codex version, the command you ran, and redacted output from `doctor`, `start`, or `smoke`. Do not paste tokens, cookies, private repository contents, customer data, or internal URLs into a public issue.

See [SECURITY.md](./SECURITY.md) and [SUPPORT.md](./SUPPORT.md).

## License

[Apache-2.0](./LICENSE.md)
