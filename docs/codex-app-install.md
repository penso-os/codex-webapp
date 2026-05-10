# Codex App Web Companion Install UX Guide

Audience: a Codex App user who may not operate a terminal directly.

Codex WebApp is an unofficial companion UI. It is not
affiliated with or endorsed by OpenAI.

This is a prompt-driven npm package path, not a native Codex App marketplace
install. Codex App runs the setup commands for the user.

The package is only the local adapter. It does not include Codex/OpenAI
binaries, `app.asar`, a pre-extracted `webview/`, tokens, cookies, signed URLs,
private session databases, private repository contents, or customer data. At
runtime it uses the Codex App renderer already installed on the user's Mac.

The intended experience is simple: paste one instruction into Codex App, let
Codex check/install the companion, start the local Codex-style Web surface, and
run a smoke test. For access from another PC or a phone, keep the machine behind
Tailscale, Cloudflare Access, or an equivalent trusted boundary.

## Paste Prompt

Paste this prompt into Codex App. Japanese is intentional here: it is written for users who may be more comfortable asking Codex App in Japanese.

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

The proof we want is not that a developer can type commands. The proof is that
a Codex App user can paste one instruction, receive a clear readiness result,
and get browser-smoke evidence or a useful failure diagnosis.
