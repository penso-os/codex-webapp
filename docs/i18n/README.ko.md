> **Unofficial community project.** This project is not affiliated with,
> endorsed by, sponsored by, or associated with OpenAI or the official Codex App.

# Codex WebApp

[English](../../README.md) / [日本語](../../README.ja.md) / 한국어 / [简体中文](./README.zh-CN.md)

Codex App 사용자를 위한 브라우저 companion입니다.

Codex App에 붙여 넣을 수 있는 프롬프트, `doctor`, 안전한 로컬 실행, 그리고 실제 Codex 스타일 브라우저 화면이 열리는지 확인하는 smoke test를 제공합니다.

![Codex WebApp overview](../assets/codex-webapp-overview.svg)

> OpenAI와 제휴하거나 OpenAI가 보증한 공식 제품이 아닙니다.
>
> 원본 UI 서버는 기본적으로 `localhost`에만 두세요. 휴대폰이나 다른 PC에서 접근하려면 Tailscale, Cloudflare Access, 또는 동등한 신뢰 경계를 먼저 설정하세요. 공개 IP에 직접 노출하지 마세요.

Note: The software interface is currently available mainly in English. This
Korean documentation has been translated for setup convenience.

## 빠른 시작: Codex App

아래 프롬프트를 Codex App에 붙여 넣으세요.

```text
Please set up Codex WebApp on this machine.

Use this npm package:
codex-webapp@beta

Please:
1. Check my Codex version.
2. Run the package doctor.
3. Run start in dry-run mode first.
4. Start the local browser UI only on localhost.
5. Smoke-test the printed local URL.

Keep everything on localhost unless I already have Tailscale, Cloudflare Access,
or another trusted access boundary set up.

Do not print tokens, cookies, private repo contents, customer data, or internal URLs.
```

Codex는 내부적으로 다음과 같은 명령을 실행합니다.

```bash
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

`npx`는 npm에 공개된 패키지를 임시로 실행하는 도구입니다. 사용자가 직접 프로젝트를 만들거나 의존성을 관리할 필요를 줄여 줍니다.

## 터미널로 실행

```bash
codex --version
codex remote-control --help
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

기본 로컬 URL:

```text
http://127.0.0.1:8214/
```

## Smoke Test

```bash
npx -y codex-webapp@beta smoke \
  --url http://127.0.0.1:8214/
```

공개 이슈나 스크린샷에는 토큰, 쿠키, private repository, 고객 데이터, 내부 URL을 넣지 마세요.

## 현재 beta의 범위

이 패키지는 Codex App native marketplace plugin, browser extension, one-click installer, managed hosting service가 아닙니다. Codex App에 프롬프트를 붙여 넣고, Codex가 `npx`로 npm 패키지를 실행하는 방식입니다.

현재 beta는 experimental이며 compatibility-first입니다. 현재 `0xcaff/codex-web` commit `585613f5a3a355af5aefc388ca4e31b07a472cda`를 참조하는 Codex 스타일 browser runtime을 실행하고, 그 주변에 설치, 안전, 문서, 검증 evidence 계층을 더합니다.

## Security And Privacy

이 CLI wrapper는 사용자의 prompt, repository, token, cookie, customer data를 이 프로젝트가 운영하는 third-party server로 전송하지 않습니다. 이 패키지는 browser extension을 설치하지 않으며 browser token을 `localStorage`, `chrome.storage`, extension profile에 저장하지 않습니다.

공개 issue나 screenshot에는 secret, private repository, customer data, internal URL을 포함하지 마세요.

## Acknowledgements

현재 beta는 Codex 스타일 브라우저 화면을 제공하는 public project `0xcaff/codex-web`의 접근 방식을 사용하고 참조합니다. 이 프로젝트는 그 주변에 배포, doctor, 안전 경계, 문서, 검증 evidence 계층을 추가합니다.

License: [Apache-2.0](../../LICENSE.md)
