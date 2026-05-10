# Codex WebApp

[English](../../README.md) / [日本語](../../README.ja.md) / 한국어 / [简体中文](./README.zh-CN.md)

Codex WebApp은 Codex App 사용자를 위한 비공식 local-first renderer bridge입니다. 설치된 Codex App의 `webview/` renderer를 로컬 캐시에 준비하고, `127.0.0.1`에서 제공하며, smoke test로 실제 접근 가능 여부를 확인합니다.

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
