/**
 * 「予想の材料」（kit・本番）・平均得失点差のままの版（kitRaw）・裏のシミュレーション（sim）の当たり方を比べる。OpenAI・BDL なし。
 * 3 つそろった試合だけで比べる（足りない試合は件数だけ出す）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/report-predict-audit.ts
 *   npx tsx --tsconfig tsconfig.json scripts/report-predict-audit.ts --audit --days 14   # 先に採点を回す
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { GAME_PRO_INSIGHTS_COLLECTION } from "../lib/nba/insights/gameProInsightStore";
import {
  PREDICT_AUDIT_VERSION,
  runPredictAudits,
  type PredictAudit,
  type PredictAuditEngine,
} from "../lib/nba/insights/predictKit/runPredictAudits";

const args = process.argv.slice(2);
const daysArg = args.indexOf("--days");
const days = daysArg >= 0 ? Number(args[daysArg + 1]) : 3;

function summarize(rows: PredictAuditEngine[]) {
  const n = rows.length;
  if (!n) return null;
  const picked = rows.filter((r) => r.pickedRight != null);
  const mean = (f: (r: PredictAuditEngine) => number) => rows.reduce((s, r) => s + f(r), 0) / n;
  return {
    n,
    winnerHit: `${((picked.filter((r) => r.pickedRight).length / Math.max(1, picked.length)) * 100).toFixed(1)}%`,
    brier: mean((r) => r.brier).toFixed(3),
    marginMae: mean((r) => Math.abs(r.marginErr)).toFixed(1),
    marginRmse: Math.sqrt(mean((r) => r.marginErr ** 2)).toFixed(1),
    totalMae: mean((r) => Math.abs(r.totalErr)).toFixed(1),
    totalBias: mean((r) => r.totalErr).toFixed(1),
    totalInBand: `${((rows.filter((r) => r.inBand).length / n) * 100).toFixed(0)}%`,
  };
}

async function main() {
  const db = getAdminDb();
  if (args.includes("--audit")) {
    const r = await runPredictAudits(db, { lookbackDays: days, force: args.includes("--force") });
    console.log("audit:", r);
  }
  const snap = await db
    .collection(GAME_PRO_INSIGHTS_COLLECTION)
    .where("predictAudit.v", "==", PREDICT_AUDIT_VERSION)
    .select("predictAudit")
    .get();
  const audits = snap.docs.map((d) => d.data().predictAudit as PredictAudit);
  const all3 = audits.filter((a) => a.kit && a.kitRaw && a.sim);
  console.log(
    `audited=${audits.length}  kit=${audits.filter((a) => a.kit).length}  kitRaw=${audits.filter((a) => a.kitRaw).length}  sim=${audits.filter((a) => a.sim).length}  all three=${all3.length}`
  );
  if (!all3.length) {
    console.log("No games have all three engines scored yet");
    return;
  }
  console.table({
    "kit (live)": summarize(all3.map((a) => a.kit!)),
    "kitRaw (plain margin)": summarize(all3.map((a) => a.kitRaw!)),
    sim: summarize(all3.map((a) => a.sim!)),
  });
  console.log(
    "kit = what Pro users saw (garbage-time-removed + opponent-adjusted strength when kitBasis=cleanSos)\n" +
      "winnerHit / brier (lower is better) / point-margin error / total error / share of totals inside the band (kit ±13, sim p25-p75)"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
