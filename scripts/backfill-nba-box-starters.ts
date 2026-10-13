/**
 * 既存の NBA 試合の box score に確定先発（BDL `/nba/v1/lineups`）を入れる（一度だけ）。
 * 以後はライブ ingest が試合中に `liveStarterIds` を書く。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-nba-box-starters.ts --seasons 2025-26,2026-27 --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-nba-box-starters.ts --seasons 2025-26,2026-27
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { fetchBdlGameStarterIds } from "../lib/nba/bdl/fetchBdlGameLineups";
import { applyStarterIdsToLiveStats } from "../lib/nba/bdl/mapBdlBoxScoreToLiveStats";
import type { LiveGameStatsDoc } from "../lib/games/liveGameStats";

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

async function main() {
  const db = getAdminDb();
  const dryRun = process.argv.includes("--dry-run");
  const seasons = (arg("seasons") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (seasons.length === 0) throw new Error("--seasons 2025-26,2026-27 を指定してください");

  const targets: { ref: FirebaseFirestore.DocumentReference; bdlGameId: number; liveStats: LiveGameStatsDoc }[] = [];
  for (const season of seasons) {
    const snap = await db
      .collection("games")
      .where("league", "==", "nba")
      .where("season", "==", season)
      .get();
    for (const doc of snap.docs) {
      const d = doc.data();
      const box = d.liveStats?.box;
      if (!Array.isArray(box?.home) || !Array.isArray(box?.away)) continue;
      if (Array.isArray(d.liveStarterIds) && d.liveStarterIds.length > 0) continue;
      const bdlGameId = Number(d.bdlGameId);
      if (!Number.isFinite(bdlGameId)) continue;
      targets.push({ ref: doc.ref, bdlGameId, liveStats: d.liveStats as LiveGameStatsDoc });
    }
    console.log(`${season}: games=${snap.size} targets(累計)=${targets.length}`);
  }

  const starters = await fetchBdlGameStarterIds(targets.map((t) => t.bdlGameId));
  let updated = 0;
  let missing = 0;
  let batch = db.batch();
  let inBatch = 0;
  for (const t of targets) {
    const ids = starters.get(t.bdlGameId);
    if (!ids) {
      missing += 1;
      continue;
    }
    const next = applyStarterIdsToLiveStats(t.liveStats, ids);
    updated += 1;
    if (dryRun) continue;
    batch.update(t.ref, { liveStarterIds: ids, "liveStats.box": next.box });
    if (++inBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (!dryRun && inBatch > 0) await batch.commit();
  console.log(JSON.stringify({ seasons, targets: targets.length, updated, missingLineups: missing, dryRun }));
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
