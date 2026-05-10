# Codex WebApp

[![CI](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codex-webapp?label=npm)](https://www.npmjs.com/package/codex-webapp)
[![License](https://img.shields.io/npm/l/codex-webapp)](./LICENSE.md)

[English](./README.md) / 日本語 / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

**Codex WebApp は、Codex App ユーザー向けの非公式・ローカルファーストな renderer bridge です。** インストール済み Codex App の `/Applications/Codex.app/Contents/Resources/app.asar` から `webview/` だけを `~/.cache/codex-webapp/` へ抽出し、その renderer を `127.0.0.1` で配信し、最後に smoke test まで行えるようにします。

![Codex WebApp の流れ](./docs/assets/codex-webapp-overview.svg)

## Codex App から始める

Codex App に次を貼ってください。

```text
Codex WebApp をこのPCで起動してください。

これは Codex App ユーザー向けの非公式ローカル renderer bridge です。
token、cookie、private repository の中身、顧客データ、内部URL、`.env`、SECRET、KEY、TOKEN を含む内容は表示しないでください。

次の順番で進めてください。

1. `node -v`、`npm -v`、`npx -v` を確認してください。
2. `npx -y codex-webapp@latest doctor` を実行してください。
3. doctor が失敗した場合は、start に進まず原因と直し方を説明してください。
4. `npx -y codex-webapp@latest start --dry-run` を実行してください。
5. 問題なければ `npx -y codex-webapp@latest start` を実行してください。
6. 起動できたら `http://127.0.0.1:8214/` をブラウザで開くように案内してください。
7. terminal window を閉じるとWeb画面は止まること、PC再起動後はもう一度 start が必要なことも説明してください。

スマホや外出先PCから使う場合は、raw UI server を public IP へ直接公開せず、Tailscale、Cloudflare Access、または同等の信頼できるアクセス境界を使ってください。
```

実際にはおおむね次を実行します。

```bash
npx -y codex-webapp@latest doctor
npx -y codex-webapp@latest start --dry-run
npx -y codex-webapp@latest start
```

## ターミナルから始める

```bash
npx -y codex-webapp doctor
npx -y codex-webapp start --dry-run
npx -y codex-webapp start
```

起動したら開きます。

```text
http://127.0.0.1:8214/
```

表示確認:

```bash
npx -y codex-webapp smoke --url http://127.0.0.1:8214/
```

screenshot 証跡:

```bash
npx -y codex-webapp smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

## 何を起動するか

`codex-webapp start` は、この package に同梱されているローカル renderer bridge を起動します。bridge は、このMacにインストール済みの Codex App から webview を準備し、抽出済み renderer を `~/.cache/codex-webapp/` にcacheし、cache header付きで静的配信します。別runtimeを同梱せず、hosted service でもなく、phone-home もしません。

この package は adapter であり、Codex App 本体ではありません。Codex/OpenAI binaries、`app.asar`、抽出済み `webview/`、token、cookie、signed URL、private session database、private repository contents、customer data は同梱しません。実行時にユーザーのローカル Codex App を読み、`webview/` だけをユーザーのローカル cache に抽出して、そのローカルコピーを配信します。

| コマンド | 目的 |
| --- | --- |
| `doctor` | Codex CLI、version、`remote-control` の利用可否を確認します。 |
| `start --dry-run` | 実際には起動せず、予定URLを表示します。 |
| `start` | インストール済み Codex App renderer を準備して配信します。 |
| `start --yes` | 対話確認なしで起動します。 |
| `smoke` | UI URLが応答し、期待する文字列を含むか確認します。 |
| `smoke --browser --screenshot ...` | browserで開いて証跡を保存します。 |

adapter boundary の開発者向け概要は [Architecture](./docs/architecture.md) を参照してください。

## 安全性

URLに到達できる人は、そのhost上の Codex を操作できる可能性があります。そのため Codex WebApp はデフォルトで `127.0.0.1` に bind し、非 loopback host は `--allow-non-loopback` を明示しない限り拒否します。

raw UI server を public IP に直接公開しないでください。スマホや別PCから使う場合は、Tailscale、Cloudflare Access、WireGuard、SSH tunneling、または同等の信頼できるアクセス境界を先に置いてください。

Codex WebApp は telemetry、analytics、browser extension、project-operated phone-home path を含みません。

## 起動中だけ使える

Codex WebApp はクラウドサービスではありません。`npx -y codex-webapp start` がこのPCで動いている間だけ、ブラウザUIを使えます。

| できごと | 何が起きるか | どうするか |
| --- | --- | --- |
| terminal window を閉じた | UIは止まります。 | もう一度 `npx -y codex-webapp start` を実行します。 |
| PCをスリープした | 接続が切れることがあります。 | 開けない場合は起動し直します。 |
| PCを再起動した | プロセスは残りません。 | 再起動後にもう一度 start します。 |
| スマホから開きたい | `127.0.0.1` は同じPCだけです。 | 信頼できるアクセス境界を先に用意します。 |

## 必要条件

| 項目 | version または補足 |
| --- | --- |
| Codex CLI | `0.130.0` 以上。 |
| Codex App | macOS app として `/Applications/Codex.app` にインストール済み。 |
| Node.js | `20.11` 以上。 |
| network binding | デフォルトは `127.0.0.1`。 |
| package | npm の `codex-webapp`。 |

Codex が古い場合:

```bash
npm install -g @openai/codex@latest
codex --version
codex remote-control --help
```

Codex App が標準位置に無い場合は先にインストールするか、`CODEX_APP_PATH` でローカルの `Codex.app` を指定するか、`CODEX_WEBAPP_CODEX_ASAR` でローカルの `app.asar` を指定してください。この package は実行時に `webview/` だけを抽出します。上流rendererファイルは package に含めません。

ローカル renderer cache を消したい場合は `~/.cache/codex-webapp/` を削除してください。次に `start` したときに再作成されます。

## Development

```bash
npm test
npm pack --dry-run
npm run start:dry-run
npm run verify:clean-release
```

release handoff 前に clean release gate を実行し、redact 済みの証跡を添付してください。詳細は [Clean Release Verification](./docs/clean-release-verification.md) を参照してください。

## Support

issue には OS、shell、Node version、Codex version、実行した command、redact 済みの `doctor` / `start` / `smoke` output を入れてください。token、cookie、private repository contents、customer data、internal URL は public issue に貼らないでください。

[SECURITY.md](./SECURITY.md) と [SUPPORT.md](./SUPPORT.md) も参照してください。

## License

[Apache-2.0](./LICENSE.md)
