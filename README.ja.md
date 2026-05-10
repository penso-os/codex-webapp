# Codex WebApp

[English](./README.md) / 日本語 / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

Codex App から、Codex 風のブラウザ画面を開くための小さな非公式 npm package です。

Codex の準備確認、ローカルUIの起動、表示確認を、Codex App に貼るだけのプロンプトで進めやすくします。

![Codex WebApp overview](./docs/assets/codex-webapp-overview.svg)

## Codex App に貼る

以下をそのまま Codex App に貼ってください。

```text
Please set up Codex WebApp on this machine.

Use this npm package:
codex-webapp@beta

Please:
1. Check my Codex version.
2. Run the package doctor.
3. Run start in dry-run mode first.
4. Start the local browser UI on localhost.
5. Smoke-test the printed local URL.

Do not print tokens, cookies, private repo contents, customer data, or internal URLs.
```

Codex はだいたい次のコマンドを実行します。

```bash
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

`npx` は、npm に公開されている package を一時的に実行する仕組みです。ユーザーが手でプロジェクトを作る必要はありません。

## ターミナルで使う

```bash
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

デフォルトURL:

```text
http://127.0.0.1:8214/
```

表示確認:

```bash
npx -y codex-webapp@beta smoke --url http://127.0.0.1:8214/
```

## 何をするものか

- Codex CLI が入っているか確認する
- `codex remote-control --help` が動くか確認する
- Codex 風のブラウザUIを localhost で起動する
- UI URL にアクセスできるか smoke test する
- Codex App から貼るだけで進めやすい導線を用意する

現在の runtime reference:

```text
github:0xcaff/codex-web#585613f5a3a355af5aefc388ca4e31b07a472cda
```

## 安全メモ

Codex WebApp は OpenAI 公式プロダクトではなく、OpenAI から承認・推奨されたものではありません。

生のUIサーバーは `localhost` のまま使ってください。スマホや別PCから使う場合は、Tailscale、Cloudflare Access、または同等の信頼できるアクセス境界を先に用意してください。

Codex WebApp は telemetry / analytics / project-operated phone-home path を含みません。browser extension もインストールしません。

## Support

issue には OS、Node version、Codex version、実行した command、redact済みの `doctor` / `start` / `smoke` output を入れてください。

token、cookie、private repo、customer data、internal URL は public issue に貼らないでください。

## License

[Apache-2.0](./LICENSE.md)
