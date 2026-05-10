# Codex WebApp 日本語クイックスタート

ブラウザでCodexを開きたいのに画面が出なくて困っている人向けの手順です。このパッケージは、Codexの準備確認、Codex-style Web UIの起動、表示疎通、そして安全境界の確認を親切にするための非公式WebApp surfaceです。

> OpenAI公式プロダクトではありません。OpenAIによる承認・提携・endorsementはありません。

## 1. Codexを最新版へ更新

`remote-control` は Codex CLI `0.130.0` 以降が必要です。

```bash
npm install -g @openai/codex@latest
```

## 2. remote-control が入っているか確認

```bash
codex --version
codex remote-control --help
```

`codex-cli 0.130.0` 以上で、helpが表示されればOKです。

## 3. friendly doctor を実行

```bash
npx -y codex-webapp doctor
```

Codexが古い、または `remote-control` が見つからない場合は、次に打つべきコマンドを表示します。

## 4. Codex-style Web UI を起動

```bash
npx -y codex-webapp start
```

このコマンドは起動前に確認プロンプトを出します。自動化された信頼済み環境だけで `--yes` を使ってください。

```bash
npx -y codex-webapp start --yes
```

## 5. ブラウザで表示できるか確認

UIサーバーが起動している状態で、実ブラウザ疎通を確認します。

```bash
npx -y codex-webapp smoke \
  --url http://127.0.0.1:8214/
```

通常のsmokeはPlaywrightなしで、UI URLを取得して `What should we` が含まれているか確認します。

スクリーンショットも残したい場合は、Playwrightを使うdeep smokeを実行します。

```bash
npx -y codex-webapp smoke \
  --browser \
  --url http://127.0.0.1:8214/ \
  --screenshot artifacts/codex-webapp.png
```

deep smokeでPlaywrightが無い場合は入れてください。

```bash
npm install -D playwright
npx playwright install chromium
```

## セキュリティ境界

raw Codex browser serverやapp-serverをpublic IPへ直接公開しないでください。モバイルから使う場合は、先にTailscale、Cloudflare Access、または同等の信頼済みアクセス境界を用意してください。

issueやチャットに、token、cookie、private repoの中身、顧客データ、内部URLを貼らないでください。
