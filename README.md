# Codex WebApp

[![CI](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codex-webapp?label=npm)](https://www.npmjs.com/package/codex-webapp)
[![License](https://img.shields.io/npm/l/codex-webapp)](./LICENSE.md)

[English](./README.md) / [日本語](./README.ja.md) / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

**Watch Codex work from your phone. Keep your project on your computer.**

Codex WebApp starts a local browser surface for the Codex App already installed on your Mac. It is meant for the everyday moment where Codex is running a task and you want to check in from another screen while your project, secrets, and working files stay on the computer doing the work. Codex App and Codex CLI must already be installed.

This project is unofficial and is not affiliated with or endorsed by OpenAI. The local-first description above is a design boundary, not an absolute security guarantee. This package provides safety rails, clear checks, and repeatable smoke evidence.

![Codex WebApp flow](./docs/assets/codex-webapp-overview.svg)

## Quick Start From Codex App

Paste this into Codex App:

```text
Please start Codex WebApp on this computer.

This is an unofficial local companion UI for Codex App users.
Do not print tokens, cookies, private repository contents, customer data, internal URLs, `.env` values, or anything containing SECRET, KEY, or TOKEN.

Please do this in order:

1. Check `node -v`, `npm -v`, and `npx -v`.
2. Run `npx -y codex-webapp@latest doctor`.
3. If doctor fails, stop and explain the fix.
4. Run `npx -y codex-webapp@latest start --dry-run`.
5. If the dry run looks good, run `npx -y codex-webapp@latest start`.
6. When it starts, tell me to open `http://127.0.0.1:8214/`.
7. Explain that pressing `Ctrl+C` or closing this terminal stops the page, and that after a computer restart I need to run start again.

For phone or remote access, do not expose the raw UI server directly to a public IP. Use Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or an equivalent trusted access boundary.
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

## What Happens When You Run This?

`codex-webapp start` starts a local adapter on your computer. The browser page exists only while that command is running.

At a high level:

1. It checks that your local Codex tools are available.
2. It prepares the browser UI from the Codex App installed on your Mac.
3. It serves that UI on a local address, by default `http://127.0.0.1:8214/`.
4. It lets the browser talk to the local Codex app server on the same machine.
5. It stops when you press `Ctrl+C`, close the terminal, sleep the machine long enough to break the connection, or restart the computer.

The package does not create a hosted account, does not keep a cloud copy of your workspace, and does not make the page available to your phone by itself. For phone access, put a trusted access boundary such as Tailscale or Cloudflare Access in front of your computer first.

## What This Package Does NOT Include

This package is the adapter, not Codex App itself. It does not include:

- Codex or OpenAI binaries
- `app.asar`
- a pre-extracted `webview/`
- tokens, cookies, signed URLs, or private keys
- private session databases
- private repository contents, prompts, customer data, or other user data
- telemetry, analytics, a browser extension, or a project-operated phone-home path

## Network Model

By default, Codex WebApp binds to `127.0.0.1`, which means the page is reachable only from the same computer. A non-loopback host requires `--allow-non-loopback` so the choice is explicit.

Anyone who can reach the running UI may be able to operate Codex on that host. Do not expose the raw UI server on a public IP. For phone or remote access, use Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or an equivalent trusted boundary with access control you understand.

This is a bounded local-first model, not a guarantee of absolute security.

## Commands

| Command | Purpose |
| --- | --- |
| `doctor` | Checks Codex CLI, version, and local command availability. |
| `start --dry-run` | Shows the planned local URL without starting the server. |
| `start` | Prepares and serves the installed Codex App renderer. |
| `start --yes` | Starts without an interactive confirmation prompt. |
| `smoke` | Checks that the local UI URL responds with expected content. |
| `smoke --browser --screenshot ...` | Opens the page in a browser and saves evidence. |

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

If Codex App is missing from the default location, install it first, set `CODEX_APP_PATH` to the local `Codex.app`, or point `CODEX_WEBAPP_CODEX_ASAR` at a local `app.asar`.

## Technical Boundary

Codex WebApp reads the installed Codex App renderer from `/Applications/Codex.app/Contents/Resources/app.asar`, extracts only the `webview/` tree into `~/.cache/codex-webapp/`, serves that renderer on `127.0.0.1`, and bridges browser calls to the local Codex app server.

Renderer files from Codex App are prepared at runtime on your machine. They are not included in this npm package and are not uploaded by this project. For a developer-friendly overview of the adapter boundary, see [Architecture](./docs/architecture.md).

## Release Evidence

Before release handoff, run the clean release gate and attach redacted evidence:

```bash
npm ci
npm test
npm run check:public-boundary
npm run verify:clean-release
npm pack --dry-run
```

On a Mac with Codex App installed, local browser evidence may also include:

```bash
npx -y codex-webapp start
npx -y codex-webapp smoke --browser --url http://127.0.0.1:8214/
```

Review screenshots before sharing them. Do not attach tokens, cookies, prompts, private repository contents, customer data, internal URLs, or other sensitive material. See [Clean Release Verification](./docs/clean-release-verification.md).

## Stop / Uninstall / Cache Cleanup

| Goal | Command or action |
| --- | --- |
| Stop the running page | Press `Ctrl+C` in the terminal running `codex-webapp start`. |
| Start again | Run `npx -y codex-webapp start`. |
| Remove the npm cache entry used by `npx` | Use your normal npm cache policy, for example `npm cache verify` or `npm cache clean --force`. |
| Remove Codex WebApp's local renderer cache | Delete `~/.cache/codex-webapp/`. |
| Remove a global install, if you installed one | Run `npm uninstall -g codex-webapp`. |

Deleting `~/.cache/codex-webapp/` is safe; the adapter will prepare the renderer again the next time `start` runs.

## Known Limitations

- macOS Codex App is expected.
- The page is available only while the local process is running.
- `127.0.0.1` is same-computer only; phone access needs a trusted network boundary.
- Sleep, restart, VPN changes, or tunnel changes can interrupt the browser session.
- This project does not provide hosted identity, account management, or remote access infrastructure.
- This project is unofficial and may need updates when Codex App internals change.

## Support

Open an issue with your OS, shell, Node version, Codex version, the command you ran, and redacted output from `doctor`, `start`, or `smoke`. Do not paste tokens, cookies, private repository contents, customer data, or internal URLs into a public issue.

See [SECURITY.md](./SECURITY.md), [SUPPORT.md](./SUPPORT.md), and the Codex App user flow in [Codex App Install UX Guide](./docs/codex-app-install.md).

## License

[Apache-2.0](./LICENSE.md)
