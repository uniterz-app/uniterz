/**
 * ASK に質問をそのまま流して、AI の読み取り・答え・答えの上に出す部品を表示する（AI を 1 問 1 回呼ぶ・約 0.08 円）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/nba-ask-try.ts "カリーのドライブに関するスタッツを教えて" "セルティックスのリバウンドは何位"
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { runNbaAsk } from "../lib/nba/ask/runNbaAsk";

async function main() {
  const questions = process.argv.slice(2).filter((q) => !q.startsWith("--"));
  if (questions.length === 0) {
    console.log("質問を引数で渡してください");
    return;
  }
  const db = getAdminDb();
  let tokensIn = 0;
  let tokensOut = 0;
  let tokensCached = 0;
  /** `--chain` で前の質問と答えを会話として続けて渡す（アプリで続けて聞いたときと同じ） */
  const chain = process.argv.includes("--chain");
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const q of questions) {
    const turns = [...(chain ? history : []), { role: "user" as const, content: q }];
    const r = await runNbaAsk({
      db,
      turns,
      language: "ja",
      timeZone: "Asia/Tokyo",
      allowStats: true,
      isPro: false,
      uid: "nba-ask-try",
    });
    tokensIn += r.promptTokens;
    tokensOut += r.completionTokens;
    tokensCached += r.cachedTokens;
    const i = r.intent;
    const read = i ? [i.kind, "query" in i ? i.query : "", "player" in i ? i.player : "", "team" in i ? i.team : ""].filter(Boolean).join(" ") : "-";
    const view = !r.view
      ? "なし（文と表だけ）"
      : r.view.kind === "team" || r.view.kind === "player"
        ? [r.view.kind, r.view.section, r.view.tab, r.view.group, r.view.count].filter(Boolean).join("/")
        : Object.values(r.view).filter((x) => x !== undefined).join("/");
    const cards = r.games?.length ? `\n   試合カード: ${r.games.map((g) => `${g.away}@${g.home} ${g.status}${g.score ? ` ${g.score}` : ""}`).join(" / ")}` : "";
    const board = r.board?.rows.length
      ? `\n   表: ${r.board.rows.length}行（${r.board.rows.slice(0, 3).map((row) => `${row.label} ${row.cells.join("/")}`).join(" | ")}${r.board.rows.length > 3 ? " …" : ""}）`
      : "";
    console.log(`Q  ${q}\n   読み取り: ${r.fast ? "即答" : read}\n   部品: ${view}\n   答え: ${r.answer.split("\n")[0]!.slice(0, 140)}${board}${cards}\n`);
    history.push({ role: "user", content: q }, { role: "assistant", content: r.answer });
  }
  console.log(
    `トークン in ${tokensIn}（うちキャッシュ ${tokensCached}）/ out ${tokensOut}（約 ${(((tokensIn - tokensCached) * 0.15 + tokensCached * 0.075 + tokensOut * 0.6) / 1e6 * 150).toFixed(2)} 円）`
  );
}

void main();
