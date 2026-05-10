# Codex WebApp

[English](../../README.md) / [日本語](../../README.ja.md) / [한국어](./README.ko.md) / 简体中文

Codex WebApp 是面向 Codex App 用户的非官方、local-first renderer bridge。它会从本机已安装的 Codex App 准备 `webview/` renderer，在 `127.0.0.1` 提供本地页面，并通过 smoke test 验证页面是否可访问。

![Codex WebApp overview](../assets/codex-webapp-overview.svg)

## Quick Start

```bash
npx -y codex-webapp doctor
npx -y codex-webapp start --dry-run
npx -y codex-webapp start
```

Open:

```text
http://127.0.0.1:8214/
```

Verify:

```bash
npx -y codex-webapp smoke --url http://127.0.0.1:8214/
```

## Safety

This project is not affiliated with or endorsed by OpenAI.

Keep the raw UI server on localhost. For phone or remote access, use Tailscale, Cloudflare Access, WireGuard, SSH tunneling, or an equivalent trusted access boundary. Do not expose the raw UI server directly to a public IP.

Do not share tokens, cookies, private repository contents, customer data, internal URLs, `.env` values, or anything containing SECRET, KEY, or TOKEN in public issues or screenshots.

## Scope

This package starts a local renderer bridge for the Codex App already installed on this computer. It is not a native Codex App marketplace plugin, browser extension, one-click installer, or managed hosting service.

License: [Apache-2.0](../../LICENSE.md)
