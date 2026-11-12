/**
 * Pro Insight 展望の試合後採点（`gameProInsights.proInsightAudit`）を集計して表示する。OpenAI なし。
 * --backfill で直近 --days 日（既定 60）の終了試合をまとめて採点してから集計する。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/report-pro-insight-audit.ts
 *   npx tsx --tsconfig tsconfig.json scripts/report-pro-insight-audit.ts --backfill --days 60
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { GAME_PRO_INSIGHTS_COLLECTION } from "../lib/nba/insights/gameProInsightStore";
import type { ProInsightAudit } from "../lib/nba/insights/proInsightAudit/buildProInsightAudit";
import { runProInsightAudits } from "../lib/nba/insights/proInsightAudit/runProInsightAudits";

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(0)}%（${a}/${b}）` : "—");

async function main() {
  const db = getAdminDb();
  if (process.argv.includes("--backfill")) {
    const days = Number(arg("days") ?? "60");
    const r = await runProInsightAudits(db, { lookbackDays: days, force: process.argv.includes("--force") });
    console.log("backfill", r);
  }

  const snap = await db.collection(GAME_PRO_INSIGHTS_COLLECTION).select("proInsightAudit").get();
  const audits = snap.docs
    .map((d) => ({ id: d.id, a: (d.data() as { proInsightAudit?: ProInsightAudit }).proInsightAudit }))
    .filter((x): x is { id: string; a: ProInsightAudit } => !!x.a);

  const t = {
    games: audits.length,
    players: 0,
    absErr: 0,
    rangeN: 0,
    inRange: 0,
    posN: 0,
    posHits: 0,
    formN: 0,
    formReverted: 0,
    mentionedN: 0,
    mentionedAbove: 0,
  };
  for (const { a } of audits) {
    const s = a.summary;
    t.players += s.players;
    t.absErr += s.absErrVsAvg;
    t.rangeN += s.rangeN;
    t.inRange += s.inRange;
    t.posN += s.posN;
    t.posHits += s.posHits;
    t.formN += s.formN;
    t.formReverted += s.formReverted;
    t.mentionedN += s.mentionedN;
    t.mentionedAbove += s.mentionedAboveAvg;
  }

  console.log(`採点済みの試合 ${t.games} / 主力 ${t.players} 人分`);
  console.log(`今季平均との差（平均）: ${t.players ? (t.absErr / t.players).toFixed(1) : "—"} 点`);
  console.log(`得点レンジに入った: ${pct(t.inRange, t.rangeN)}（目標は約 6 割）`);
  console.log(`ポジション別失点の読みの当たり: ${pct(t.posHits, t.posN)}（5 割なら当て推量と同じ）`);
  console.log(`好調・不調が平均へ戻った: ${pct(t.formReverted, t.formN)}`);
  console.log(`展望で名前を出した選手が平均を超えた: ${pct(t.mentionedAbove, t.mentionedN)}`);

  if (process.argv.includes("--players")) {
    for (const { id, a } of audits) {
      for (const p of a.players) {
        console.log(
          `${id} ${p.team} ${p.name} ppg ${p.ppg} → ${p.played ? p.pts : "DNP"}` +
            (p.low != null ? ` range ${p.low}-${p.high}${p.inRange ? " ✓" : ""}` : "") +
            (p.posRead ? ` pos:${p.posRead}${p.posHit ? " ✓" : " ✗"}` : "") +
            (p.form ? ` form:${p.form}${p.formReverted ? " reverted" : ""}` : "")
        );
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
