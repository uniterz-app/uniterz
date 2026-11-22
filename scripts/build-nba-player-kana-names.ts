/**
 * 選手名のカタカナ辞書 `nbaPlayerKanaNames/all` に、今季ロスターで辞書に無い選手を足す（AI を使う）。
 * 既定は書かずに見本を表示するだけ。日次 ingest も同じ処理で新しい選手だけ足す。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/build-nba-player-kana-names.ts --limit 40
 *   npx tsx --tsconfig tsconfig.json scripts/build-nba-player-kana-names.ts --write
 *
 * 書いたあと公開 API のキャッシュは最大 24 時間残る（管理 API の日次 ingest かデプロイで捨てる）。
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { ensureNbaPlayerKanaNames } from "../lib/nba/ask/nbaPlayerKanaNames";

async function main() {
  const write = process.argv.includes("--write");
  const li = process.argv.indexOf("--limit");
  const limit = li >= 0 ? Number(process.argv[li + 1]) : undefined;
  const r = await ensureNbaPlayerKanaNames(getAdminDb(), { write, ...(limit ? { limit } : {}) });
  console.log(`ロスター ${r.rosterPlayers} 人・辞書に無い ${r.missing} 人・今回 ${r.added} 人${write ? "を書き込み" : "（書き込みなし）"}`);
  console.log(`トークン in ${r.tokensIn} / out ${r.tokensOut}`);
  for (const s of r.sample) console.log(`  ${s.name.padEnd(28)} ${s.kana.join(" / ")}`);
}

void main();
