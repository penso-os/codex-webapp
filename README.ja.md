> **非公式の community project です。** この project は OpenAI、公式 Codex team、または公式 Codex App と提携・承認・後援・関連していません。

# Codex WebApp

[English](./README.md) / 日本語 / [한국어](./docs/i18n/README.ko.md) / [简体中文](./docs/i18n/README.zh-CN.md)

Codex App を使っている人向けの、敬意ある非公式 WebApp surface です。

Codex App に貼れるプロンプト、わかりやすい `doctor`、安全なローカル起動、そして「本当に Codex っぽいブラウザ画面が開けるか」を確認する smoke test をまとめています。

![Codex WebApp overview](./docs/assets/codex-webapp-overview.svg)

> OpenAI とは提携しておらず、OpenAI から承認・推奨された公式プロダクトではありません。
>
> 生の UI サーバーは原則 `localhost` のまま使ってください。スマホや別PCから触る場合は、Tailscale、Cloudflare Access、または同等の信頼できるアクセス境界を先に用意してください。公開IPへ直接出さないでください。

## これは何ですか

「Codex をブラウザやスマホから使えるらしい」と聞いたのに、サーバー起動後に何を開けばいいかわからない。そこを埋めるための npm パッケージです。

この beta でできること:

- Codex CLI が入っているか確認する
- `codex remote-control --help` が使えるか確認する
- npm の一時実行で `doctor` / `start` / `smoke` を走らせる
- Codex App に貼るだけのプロンプトを提供する
- ローカルの Codex 風ブラウザ UI を起動する
- smoke test で「画面が本当に見えている」ことを確認する

## いまの beta の位置づけ

現在の npm beta は `codex-webapp@0.1.0-beta.1` です。

これは Codex App の native marketplace plugin、browser extension、one-click installer、managed hosting service ではありません。Codex App にプロンプトを貼り、Codex に `npx` で npm パッケージを実行してもらう形です。

現在の方針は experimental かつ compatibility-first です。現在は `0xcaff/codex-web` の commit `585613f5a3a355af5aefc388ca4e31b07a472cda` を参照する Codex 風 browser runtime を起動し、その周辺に install、safety、evidence、support の層を加えています。この public repository は package、user documentation、safety notes、contribution path に絞ります。

注: 現在、software interface 自体は主に英語です。この日本語ドキュメントは setup を助けるための翻訳です。

## Codex App に貼るプロンプト

以下をそのまま Codex App に貼ってください。

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

Codex は内部でだいたい次のようなコマンドを実行します。

```bash
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

`npx` は「npm に公開されているパッケージを、一時的に実行するための仕組み」です。ユーザーが手でプロジェクトを作ったり、依存関係を管理したりする必要を減らします。

## ターミナルで試す場合

```bash
codex --version
codex remote-control --help
npx -y codex-webapp@beta doctor
npx -y codex-webapp@beta start --dry-run
npx -y codex-webapp@beta start
```

デフォルトでは次のローカルURLを使います。

```text
http://127.0.0.1:8214/
```

## Smoke Test

UI サーバーを起動したら、次で確認できます。

```bash
npx -y codex-webapp@beta smoke \
  --url http://127.0.0.1:8214/
```

ブラウザ証跡を撮る場合:

```bash
npx -y codex-webapp@beta smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

公開する証跡には、private repo、branch名、アカウント情報、顧客データ、token、cookie、社内URLを含めないでください。

## 安全境界

この package は、危険なネットワーク公開を安全に変える魔法ではありません。

推奨:

- 自分のMacだけで使うなら `localhost`
- 自分の端末間だけなら Tailscale
- 複数人で使うなら Cloudflare Access などの identity-aware proxy

避けること:

- 生の UI サーバーを public IP に出す
- token / cookie / customer data / private repo 内容を public issue に貼る
- OpenAI 公式プロダクトのように見せる
- 現在の beta を managed hosting service として扱う

## Security And Privacy

この package は open source で、監査可能であることを前提にしています。

CLI wrapper は、prompt、repository、token、cookie、customer data を、この project が運営する第三者サーバーへ送信しません。ローカルの Codex 風 browser surface を起動し、指定された URL に対して readiness / smoke check を行います。

この package は browser extension をインストールせず、browser token を `localStorage`、`chrome.storage`、extension profile に保存しません。ただし、下層の Codex 風 runtime や、利用者自身が用意する trusted-access layer には別の挙動があり得ます。運用境界として確認してください。

public issue や screenshot を共有する前に、secret と private URL は削除してください。

## 謝辞

現在の beta は、Codex 風ブラウザ体験を実現する public project `0xcaff/codex-web` のアプローチを利用・参照しています。この repository は、その周辺に配布、doctor、安全境界、ドキュメント、検証証跡の層を加えるものです。

詳しくは [ACKNOWLEDGEMENTS.md](./ACKNOWLEDGEMENTS.md) を参照してください。

## License

[Apache-2.0](./LICENSE.md)
