# Codex WebApp

[![CI](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/penso-os/codex-webapp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/codex-webapp?label=npm)](https://www.npmjs.com/package/codex-webapp)
[![License](https://img.shields.io/npm/l/codex-webapp)](./LICENSE.md)

[English](./README.md) / 日本語 / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

**Codex WebApp は、Codex `0.130.0` で入った `codex remote-control` を、Codex App ユーザーが貼るだけで起動しやすいローカルのブラウザUIにするための非公式 npm package です。** CLI だけでなく、ブラウザ、スマホ、アプリのような画面から Codex を触りたい人に向けて、準備確認、起動、表示確認までを短い導線にまとめます。

Codex `0.130.0` では、ヘッドレスでリモート制御可能な app-server を起動しやすくする入口として `codex remote-control` が追加されました。[^1] これは大きな前進ですが、そのリリースだけで誰でもすぐに使えるブラウザUIやスマホ向け体験が同梱されたわけではありません。Codex WebApp はその間を埋めるために、ローカルの Codex を確認し、`localhost` 上で Codex 風のWeb画面を起動し、最後に本当に開けたかを smoke test します。

![Codex WebApp overview](./docs/assets/codex-webapp-overview.svg)

## なぜ作ったか

Codex は、ターミナルだけで完結するツールから、よりアプリらしい操作体験へ広がりつつあります。開発者としては Codex を自分のマシンで動かしつつ、ブラウザ、タブレット、スマホ、あるいは Codex App から自然に操作したいはずです。この package の目的は Codex CLI を置き換えることではありません。目的は、**「remote-control が来たらしい」** から **「ローカルのブラウザUIが起動し、表示確認まで通った」** までを最短にすることです。

| 欲しい体験 | Codex WebApp が用意するもの |
| --- | --- |
| ターミナルに慣れていなくても始めたい | Codex App に貼るだけで進められるセットアップ用プロンプト。 |
| 起動前に環境を確認したい | `doctor` による Codex CLI、version、`remote-control` の確認。 |
| 安全な既定値で使いたい | デフォルトは `127.0.0.1`。非 loopback host は明示的に許可しない限り拒否。 |
| 動いた証拠が欲しい | `smoke` によるURL確認と、必要に応じたブラウザ screenshot。 |
| 何を起動しているか把握したい | 小さな wrapper と、固定された `codex-web` runtime reference。 |

> **非公式だが、丁寧に扱うための companion です。** Codex WebApp は OpenAI の公式プロダクトではなく、OpenAI から承認・推奨されたものでもありません。ローカル制御を前提にし、telemetry、analytics、browser extension、project-operated phone-home path を含まない形を目指しています。

## Codex App から始める

Codex App を使っている場合は、次の指示をそのまま貼ってください。Codex が「npm package を一時実行して、ローカルのWeb画面を起動し、ブラウザで開く」ことを認識しやすいように書いてあります。

```text
Codex WebApp をこのPCで起動してください。

これは OpenAI 公式ではない、Codex App向けの非公式 companion UI です。
token、cookie、private repository の中身、顧客データ、内部URLは表示しないでください。
`.env` や `SECRET`、`KEY`、`TOKEN` を含むterminal出力は、AIにもissueにも貼らないでください。

次の順番で進めてください。

1. まず `node -v`、`npm -v`、`npx -v` を確認してください。`npx` が使えない場合は、ここで止まり、Node.js/npm が必要だと説明してください。
2. `npx -y codex-webapp@latest doctor` を実行して、Codex CLI が 0.130.0 以上で、`codex remote-control` が使えるか確認してください。
3. `doctor` がエラーを出した場合は、ここで止まり、`start` には進まず、原因と直し方を説明してください。
4. `npx -y codex-webapp@latest start --dry-run` を実行して、起動予定の内容を確認してください。
5. 問題なければ `npx -y codex-webapp@latest start` を実行して、ローカルのブラウザUIを起動してください。
6. 起動できたら、ブラウザで `http://127.0.0.1:8214/` を開くように案内してください。
7. この terminal window を閉じるとWeb画面は止まること、止めたいときは `Ctrl+C` を押すこと、PCを再起動した後はもう一度 `npx -y codex-webapp@latest start` が必要なことも説明してください。

外出先のPCやスマホから使う場合は、raw UI server をpublic IPへ直接公開せず、Tailscale、Cloudflare Access、または同等の信頼できるアクセス境界を使ってください。認証なしのport-forwardingやpublic tunnelは使わないでください。
```

実際には、おおむね次のようなコマンドが実行されます。

```bash
npx -y codex-webapp@latest doctor
npx -y codex-webapp@latest start --dry-run
npx -y codex-webapp@latest start
```

`npx` は、npm に公開されている package を一時的に実行する仕組みです。試すだけなら、この repository を clone したり、手元で新しい project を作ったりする必要はありません。READMEでは、常に公開済みの最新パッチを使うため `codex-webapp@latest` を指定しています。

> **秘密情報はユーザー側でも確認してください。** Codexには秘密情報を出さないよう指示していますが、AIへの指示だけで安全が保証されるわけではありません。terminal output、`.env`、error log、issue本文を貼る前に、`SECRET`、`KEY`、`TOKEN`、cookie、顧客名、private URL が含まれていないか必ず見てください。

## 起動中だけ使える、という基本

Codex WebApp はクラウド上に常駐するサービスではありません。あなたのPC上で `npx -y codex-webapp@latest start` が動いている間だけ、ブラウザUIが使えます。

大事なポイントは、**PCを再起動すると、このプロセスは自動では戻らない**ということです。昨日使えていても、今日PCを再起動した後は、もう一度 `npx -y codex-webapp@latest start` を実行する必要があります。

| できごと | 何が起きるか | どうすればよいか |
| --- | --- | --- |
| terminal window を閉じた | Web画面は止まります。 | もう一度 `npx -y codex-webapp@latest start` を実行します。 |
| 起動中のUIを止めたい | terminal上のプロセスを止めます。 | 起動しているterminalで `Ctrl+C` を押してください。 |
| PCをスリープした | 復帰後に動く場合もありますが、接続が切れることがあります。 | 開けない場合は起動し直してください。 |
| PCを再起動した | プロセスは残りません。昨日のWeb画面はもう動いていません。 | 再起動後にもう一度 `npx -y codex-webapp@latest start` を実行してください。 |
| 別のPCやスマホから開きたい | `127.0.0.1` は「このPC自身」を指すため、そのままでは別端末から開けません。 | Tailscale、Cloudflare Access、または同等の安全なアクセス境界を用意してください。 |

まずは同じPCのブラウザで `http://127.0.0.1:8214/` を開けるところまでを確認してください。スマホや外出先PCからの利用は、その次の段階です。認証なしのport-forwardingやpublic tunnelでraw UI serverを公開すると、意図しない第三者にあなたのPC上のCodex操作面を見せる危険があります。

毎日使う場合は、PC起動時に自動で `npx -y codex-webapp@latest start` を実行する設定を検討できます。これは「PCを再起動しても、毎回自分でstartし直さなくてよい」ようにするための設定です。ただし、初回セットアップではなく常用者向けです。まず手動起動で `doctor`、`start`、ブラウザ表示、止め方、アクセス境界を確認してから、macOS の Login Items、`launchd`、または自分が管理できるプロセスマネージャーで設定してください。自動起動する場合も、raw UI server を認証なしで外へ出さないでください。

## ターミナルから始める

自分でコマンドを実行したい場合は、次の順番で進めてください。Codex WebApp には **Node.js 20 以上** と **Codex CLI 0.130.0 以上** が必要です。

```bash
npx -y codex-webapp doctor
npx -y codex-webapp start --dry-run
npx -y codex-webapp start
```

デフォルトでは、ローカルマシン上の次のURLでブラウザUIが開きます。

```text
http://127.0.0.1:8214/
```

UIが起動したら、URLに到達できるかを確認します。

```bash
npx -y codex-webapp smoke --url http://127.0.0.1:8214/
```

issue や検証用にブラウザの証跡が必要な場合は、screenshot 付きの smoke test を実行できます。

```bash
npx -y codex-webapp smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

## 内部で何をしているか

Codex WebApp は、できるだけ薄い wrapper として作られています。まずローカルの `codex` 実行ファイルが存在するかを確認し、version が `remote-control` に対応しているかを見ます。そのうえで `codex remote-control --help` が動くことを確認し、loopback address 上で Codex 風のWeb画面を起動します。最後に `smoke` でURL到達性を確認するため、セットアップの結果が曖昧になりにくい構成です。

| コマンド | 目的 | 期待される結果 |
| --- | --- | --- |
| `doctor` | Codex CLI、version、`remote-control` の利用可否を確認します。 | 準備完了の要約、または更新が必要な箇所の説明。 |
| `start --dry-run` | 実際には起動せず、起動予定の内容を表示します。 | ローカルURLと内部で実行する `npx` command。 |
| `start` | 確認後にローカルのブラウザUIを起動します。 | `http://127.0.0.1:8214/` で動くUI。 |
| `start --yes` | 対話確認なしで起動します。 | script や自動化されたローカル検証に便利。 |
| `smoke` | UI URL に到達でき、期待する内容があるかを確認します。 | 速い pass/fail 結果。 |
| `smoke --browser --screenshot ...` | headless browser でUIを開き、証跡を保存します。 | debug や support に使える screenshot。 |

現在の runtime reference は次の通りです。

```text
github:0xcaff/codex-web#585613f5a3a355af5aefc388ca4e31b07a472cda
```

## 安全性について

このブラウザUIは強力です。URLに到達できる人は、そのhost上の Codex を操作できる可能性があります。そのため、Codex WebApp はデフォルトで `127.0.0.1` に bind し、非 loopback host は `--allow-non-loopback` を明示しない限り拒否し、起動前に確認を出します。

| シナリオ | 推奨される境界 |
| --- | --- |
| 同じマシンで使う | デフォルトの `http://127.0.0.1:8214/` のまま使ってください。 |
| 自分のスマホや別PCから使う | Tailscale、Cloudflare Access、または同等の信頼できるアクセス境界を先に用意してください。 |
| public internet から直接見せる | 生のUIサーバーを public IP に直接公開しないでください。 |
| issue で相談する | token、cookie、private repository、customer data、internal URL は必ず redact してください。 |

Codex WebApp は telemetry、analytics、browser extension、project-operated phone-home path を含みません。また、extension を入れないため、browser token を extension storage に保存することもありません。

## 必要条件

| 項目 | version または補足 |
| --- | --- |
| Codex CLI | `codex remote-control` を使うため、`0.130.0` 以上が必要です。 |
| Node.js | `20` 以上が必要です。 |
| network binding | デフォルトは `127.0.0.1`。非 loopback host は明示的な opt-in が必要です。 |
| package channel | npm の `latest` channel から `codex-webapp` を使ってください。現在の release は `0.1.5` です。 |

Codex が入っていない、または古い場合は、先に更新してください。

```bash
npm install -g @openai/codex@latest
codex --version
codex remote-control --help
```

## Troubleshooting

多くの失敗は、Codex CLI の有無、version、`remote-control` の有無、port、URL のどれかに集約されます。issue を開く場合は、以下の確認結果を redact したうえで共有してください。

| 症状 | 最初に見るもの | 次に試すこと |
| --- | --- | --- |
| `Codex CLI was not found` と出る | `codex --version` | Codex CLI を install または update してください。 |
| `remote-control` が使えない | `codex remote-control --help` | Codex CLI `0.130.0` 以上へ更新してください。 |
| UI が開かない | `npx -y codex-webapp start --dry-run` | port の衝突や起動コマンドを確認してください。 |
| smoke test が失敗する | `npx -y codex-webapp smoke --url http://127.0.0.1:8214/` | server が起動中か、URL が正しいかを確認してください。 |
| debug 用の証跡が欲しい | `smoke --browser --screenshot artifacts/codex-webapp.png` | screenshot と redact 済み log を issue に添付してください。 |

## Development

```bash
npm test
npm pack --dry-run
npm run start:dry-run
```

## Support

issue には OS、shell、Node version、Codex version、実行した command、redact 済みの `doctor` / `start` / `smoke` output を入れてください。token、cookie、private repository contents、customer data、internal URL は public issue に貼らないでください。

追加の方針は [SECURITY.md](./SECURITY.md)、[SUPPORT.md](./SUPPORT.md)、[ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md) を参照してください。

## License

[Apache-2.0](./LICENSE.md)

## References

[^1]: [openai/codex Releases: 0.130.0](https://github.com/openai/codex/releases/tag/rust-v0.130.0) では、`codex remote-control` が headless かつ remotely controllable な app-server を起動しやすくする entrypoint として追加されたことが説明されています。
