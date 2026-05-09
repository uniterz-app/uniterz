/**
 * SNS 用に一時的な公開 HTTPS オリジンを用意する（localtunnel）。
 * .env.local の管理ブロックを書き換えたあと、next dev を再起動すると共有 URL がトンネル向きになる。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import localtunnel from "localtunnel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const MARK_START = "# --- uniterz sns-share-tunnel ここから ---";
const MARK_END = "# --- uniterz sns-share-tunnel ここまで ---";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** このスクリプトが直前に書いたブロックだけ除去 */
function stripManagedBlock(content) {
  const re = new RegExp(
    `(?:^|\\n)${escapeRegExp(MARK_START)}[\\s\\S]*?${escapeRegExp(MARK_END)}\\n?`,
    "g"
  );
  return content.replace(re, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function injectManagedBlock(content, origin) {
  const base = stripManagedBlock(content);
  const block = `${MARK_START}\nNEXT_PUBLIC_APP_URL=${origin}\n${MARK_END}\n`;
  const merged = base ? `${base}\n\n${block}` : block;
  return `${merged.trim()}\n`;
}

function readEnvLocal() {
  try {
    return fs.readFileSync(envPath, "utf8");
  } catch {
    return "";
  }
}

function writeEnvLocal(content) {
  fs.writeFileSync(envPath, content, "utf8");
}

const port = Number(process.env.TUNNEL_PORT || process.env.PORT || 3000);

let tunnel;

const shutdown = async (reason) => {
  if (tunnel) {
    try {
      tunnel.close();
    } catch {
      /* 無視 */
    }
  }
  try {
    const raw = readEnvLocal();
    if (raw.includes(MARK_START)) {
      const cleaned = stripManagedBlock(raw);
      writeEnvLocal(cleaned ? `${cleaned}\n` : "");
      console.log("\n.env.local から sns-share-tunnel 用のブロックを削除しました。");
    }
  } catch (e) {
    console.error(".env.local の復元に失敗しました。手動で該当コメントブロックを削除してください。", e);
  }
  if (reason) console.log(reason);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("\nトンネルを終了しました。"));
process.on("SIGTERM", () => void shutdown());

try {
  tunnel = await localtunnel({ port });
} catch (e) {
  console.error("トンネルを開けませんでした。`npm run dev` が別ターミナルで port", port, "で待っているか確認してください。");
  console.error(e);
  process.exit(1);
}

let origin = tunnel.url.replace(/\/$/, "");
if (!/^https?:\/\//i.test(origin)) {
  origin = `https://${origin}`;
}

writeEnvLocal(injectManagedBlock(readEnvLocal(), origin));

console.log(`
[SNS 共有プレビュー用トンネル]
公開オリジン: ${origin}
ローカル転送先: http://127.0.0.1:${port}

次の手順:
1. 開発サーバーを一度止め、もう一度起動する（NEXT_PUBLIC_APP_URL を読み直すため）
   npm run dev
2. ブラウザは「${origin}」経由で開くか、共有メニューのリンクが上記オリジンになっていることを確認
3. X などにその共有 URL を貼ってカード表示を試す

注意: loca.lt はブラウザでリンクを開くと「Tunnel website ahead」（IP 入力）の確認ページが出ることがあります。
同じ端末でもタブを閉じたりトンネルを張り直すと、また出ることがあります（本番 URL では出ません）。
X のクローラが失敗する場合もあるため、そのときは ngrok や Cloudflare Tunnel、または Vercel プレビューを検討してください。

重要: このプロセスを止めるとブラウザでは「503 - Tunnel Unavailable」になります。
共有 URL を有効にする間は、本ターミナル（share:tunnel）と npm run dev の両方を動かしたままにしてください。
トンネルを張り直すたびにホスト名が変わることが多く、X に投稿済みの古い loca.lt URL はそのままでは開けません。

このプロセスを Ctrl+C で止めると、.env.local の管理ブロックを削除します。

このターミナルは「プロンプト（%）に戻る」まで開いたままにしてください。
すぐ % に戻った場合はトンネルが切れており、ブラウザは 503 になります。
`);

tunnel.on("close", () => {
  console.log(
    "\nトンネルが閉じました。npm run share:tunnel を再実行するか Ctrl+C で終了してください。"
  );
  process.exit(1);
});

tunnel.on("error", (err) => {
  console.error("\nトンネルエラー:", err);
});

// localtunnel 確立後に Node が即終了し 503 になるのを防ぐ（イベントループを維持）
await new Promise(() => {
  /* Ctrl+C で shutdown が process.exit するまで待機 */
});
