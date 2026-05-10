# Architecture

Codex WebApp is a small, local adapter for people who already have the macOS
Codex App installed on their Mac. It does not replace Codex App and it does not ship a
separate Codex runtime. The package prepares the renderer that is already on
the user's machine, serves it on a local web address, and bridges browser
requests to the local Codex command-line tools.

## What The Package Includes

The npm package includes the adapter code:

- a command-line wrapper for `doctor`, `start`, and `smoke`
- local server code that serves static renderer files from the user's cache
- a small browser preload and bridge layer for local app-server communication
- tests, docs, and public support files

The package does not bundle or publish user or vendor runtime artifacts:

- no Codex/OpenAI binaries
- no `app.asar`
- no pre-extracted `webview/` directory
- no tokens, cookies, session IDs, or private keys
- no signed URLs
- no private session database
- no repository contents, prompts, customer data, or other user data

In short: the npm package is the adapter. The renderer source remains the Codex
App that the user installed locally.

## Runtime Flow

When a user runs `codex-webapp start`, the adapter does this on the local
machine:

1. Locates Codex App.
   By default it expects `/Applications/Codex.app`. Users can override this
   with `CODEX_APP_PATH` or point directly at a local archive with
   `CODEX_WEBAPP_CODEX_ASAR`.
2. Reads the local Codex App renderer archive.
   The expected archive is `Contents/Resources/app.asar` inside the app bundle.
3. Extracts only the `webview/` tree.
   The files are copied into `~/.cache/codex-webapp/<fingerprint>/webview/`.
   Other archive contents are not served.
4. Serves the prepared renderer.
   The local HTTP server defaults to `http://127.0.0.1:8214/` and serves the
   cached static files with normal cache headers.
5. Bridges browser calls to the local Codex app server.
   The adapter starts `codex app-server --listen stdio://` when browser IPC
   needs it, speaks JSON over stdio, and keeps that process local to the host.

The extraction cache is local machine state. It is not included in the npm
package and is not uploaded by this project. Users can remove it by deleting
`~/.cache/codex-webapp/`; the adapter will prepare it again on the next start.

## Adapter Responsibilities

Codex WebApp owns these public, package-level responsibilities:

| Area | Responsibility |
| --- | --- |
| Codex App discovery | Find the user's local Codex App or accept explicit local paths through environment variables. |
| Local extraction | Read the local `app.asar`, extract only `webview/`, transform the local `index.html` enough to load the browser bridge, and cache the result under the user's home directory. |
| Static UI serving | Serve the prepared renderer on a localhost-first HTTP server and block unsafe path traversal requests. |
| App-server bridge | Start and communicate with the local `codex app-server` process over stdio for browser-side app calls. |
| `doctor` | Check that Codex CLI is installed, new enough, and exposes the expected local commands. |
| `start` | Confirm the binding, prepare the renderer, and start the local server. |
| `smoke` | Verify that the local URL responds, and optionally capture browser evidence. |

## Local-First Boundary

The default binding is `127.0.0.1`. A non-loopback host requires an explicit
`--allow-non-loopback` flag because anyone who can reach the UI may be able to
operate Codex on that machine.

For phone or remote access, keep the raw UI behind a trusted access boundary
such as Tailscale, Cloudflare Access, WireGuard, or SSH tunneling. Codex WebApp
does not provide hosted access, identity, or account management.

## Public Documentation Boundary

This repository should describe the adapter in practical terms: what it starts,
what it reads locally, what it caches locally, and how users can verify it. Keep
the wording friendly and concrete. Avoid implying that the package contains
Codex App, OpenAI binaries, private session material, or customer data.
