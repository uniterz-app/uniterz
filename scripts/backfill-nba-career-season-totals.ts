/**
 * 既存の `nbaPlayerCareerSeasons/{playerId}` のレギュラー行に正確な合計（`totals`）を入れる（一度だけ）。
 * BDL の平均は小数 1 桁に丸め済みで、通算の節目（LEAGUE hub）が平均 × 試合数だと 10 本以上ずれる選手がいる。
 * 以後はキャリア ingest が `totals` を書く。
 *
 * 既定の対象は `nbaLeagueHubCareerBase/{season}` に入っている節目候補。書いたらそのキャッシュを消す
 * （次の hub ingest が作り直す）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-nba-career-season-totals.ts --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-nba-career-season-totals.ts
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-nba-career-season-totals.ts --players 140,237
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { bdlNbaGetAllPages } from "../lib/nba/bdl/bdlNbaFetch";
import { parseBdlStatMinutes } from "../lib/nba/bdl/fetchBdlPlayerGameLogs";
import { sumBdlStatTotals } from "../lib/nba/bdl/fetchBdlPlayerSeasonGameMeta";
import { forEachWithConcurrency } from "../lib/async/forEachWithConcurrency";
import { careerBaseFromRows } from "../lib/nba/leagueHub/buildLeagueHubExtras";
import { careerSeasonTotalsFromLogs } from "../lib/nba/playerDetail/mapBdlToPlayerCareerSeasons";
import { NBA_LEAGUE_HUB_CAREER_BASE_COLLECTION } from "../lib/nba/leagueHub/leagueHubTypes";
import type { NbaPlayerCareerSeasonRow } from "../lib/predict/nbaPlayerDetailPreviewMocks";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

type StatRow = {
  min?: string | number | null;
  pts?: number | null;
  reb?: number | null;
  ast?: number | null;
  fg3m?: number | null;
  game?: { season?: number } | null;
};

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

async function main() {
  const db = getAdminDb();
  const dryRun = process.argv.includes("--dry-run");
  const seasonKey = arg("season") ?? CURRENT_NBA_SEASON_KEY;
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  const cacheRef = db.collection(NBA_LEAGUE_HUB_CAREER_BASE_COLLECTION).doc(seasonKey);

  let ids = (arg("players") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    const cache = await cacheRef.get();
    ids = Object.keys((cache.get("players") as Record<string, unknown> | undefined) ?? {});
  }
  console.log(`season=${seasonKey} players=${ids.length} dryRun=${dryRun}`);

  let updated = 0;
  let exactSeasons = 0;
  let mismatchSeasons = 0;
  let failed = 0;
  const diffs: Array<{ id: string; stat: string; before: number; after: number }> = [];

  await forEachWithConcurrency(ids, 3, async (id, i) => {
    try {
      const ref = db.collection("nbaPlayerCareerSeasons").doc(id);
      const snap = await ref.get();
      const regular = snap.get("regular") as NbaPlayerCareerSeasonRow[] | undefined;
      if (!Array.isArray(regular)) return;
      const years = [
        ...new Set(regular.filter((r) => r.seasonStart < startYear && !r.totals).map((r) => r.seasonStart)),
      ];
      if (years.length === 0) return;

      const rows = await bdlNbaGetAllPages<StatRow>("/nba/v1/stats", {
        "player_ids[]": Number(id),
        "seasons[]": years,
        season_type: "regular",
      });
      const bySeason = new Map<number, StatRow[]>();
      for (const r of rows) {
        const season = r.game?.season;
        if (typeof season !== "number" || parseBdlStatMinutes(r.min) <= 0) continue;
        const list = bySeason.get(season) ?? [];
        list.push(r);
        bySeason.set(season, list);
      }

      let changed = false;
      const next = regular.map((r) => {
        if (r.seasonStart >= startYear || r.totals) return r;
        const played = bySeason.get(r.seasonStart) ?? [];
        const totals = careerSeasonTotalsFromLogs(r, sumBdlStatTotals(played), played.length);
        if (played.length !== r.games) {
          mismatchSeasons += 1;
          console.log(
            `  mismatch player=${id} season=${r.seasonStart} games=${r.games} logs=${played.length}${totals ? "（欠けた分を平均で埋める）" : ""}`
          );
        }
        if (!totals) return r;
        exactSeasons += 1;
        changed = true;
        return { ...r, totals };
      });
      if (!changed) return;

      const before = careerBaseFromRows(regular, startYear);
      const after = careerBaseFromRows(next, startYear);
      for (const stat of ["pts", "reb", "ast", "fg3m"] as const) {
        if (before[stat] !== after[stat]) diffs.push({ id, stat, before: before[stat], after: after[stat] });
      }
      updated += 1;
      if (!dryRun) await ref.update({ regular: next });
    } catch (e) {
      failed += 1;
      console.error(`  failed player=${id}`, e);
    }
    if ((i + 1) % 25 === 0) console.log(`${i + 1}/${ids.length} updated=${updated}`);
  });

  const worst = [...diffs].sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before));
  for (const d of worst.slice(0, 25)) {
    console.log(`  ${d.id} ${d.stat}: ${d.before} → ${d.after} (${d.after - d.before > 0 ? "+" : ""}${d.after - d.before})`);
  }
  console.log(
    `updated=${updated} exactSeasons=${exactSeasons} mismatchSeasons=${mismatchSeasons} failed=${failed}`
  );
  if (!dryRun && updated > 0) {
    await cacheRef.delete();
    console.log(`deleted ${NBA_LEAGUE_HUB_CAREER_BASE_COLLECTION}/${seasonKey}（次の hub ingest で作り直し）`);
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
