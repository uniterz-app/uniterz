/**
 * これからの試合の「予想の材料」+ 裏のシミュレーション（`refreshPredictKits`）を手で回す。OpenAI・BDL なし。
 * 既定は書き込まずに表示だけ。`--write` で gameProInsights に保存（書いたら公開 API のキャッシュは
 * 次の pro-brief ingest か `/api/admin/nba-pro-brief-ingest` で捨てる）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/refresh-predict-kits.ts [--write] [--hourly]
 *   （既定 = 20:00 の回と同じく 24h 以内を全部。--hourly = 毎時の回と同じく、もうある予想を欠場が変わったときだけ）
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import { proInsightTeamAbbr } from "../lib/nba/insights/proInsightFacts/teamAbbr";
import { refreshPredictKits } from "../lib/nba/insights/predictKit/refreshPredictKits";

const args = process.argv.slice(2);
const write = args.includes("--write");
async function main() {
  const t0 = Date.now();
  const r = await refreshPredictKits(getAdminDb(), {
    dryRun: !write,
    mode: args.includes("--hourly") ? "hourly" : "daily",
  });
  console.log(
    `games=${r.games} kitWritten=${r.kitWritten} simWritten=${r.simWritten} unchanged=${r.skipped}` +
      `${r.noChange ? " (injuries unchanged, skipped)" : ""}${write ? "" : " (dry run)"} ${Date.now() - t0}ms`
  );
  if (args.includes("--json")) {
    const db = getAdminDb();
    const entries = Object.entries(r.kits ?? {});
    const games = entries.length
      ? await db.getAll(...entries.map(([id]) => db.collection("games").doc(id)), { fieldMask: ["marketPickCounts"] })
      : [];
    const samples = entries.map(([, { kit }], i) => {
      const c = (games[i]?.get("marketPickCounts") ?? {}) as { home?: number; away?: number };
      const total = (c.home ?? 0) + (c.away ?? 0);
      return {
        homeTeamId: kit.teams[0].teamId,
        awayTeamId: kit.teams[1].teamId,
        kit,
        ...(total ? { crowd: { homePct: Math.round(((c.home ?? 0) / total) * 1000) / 10, total } } : {}),
      };
    });
    console.log(JSON.stringify(samples, null, 2));
    return;
  }
  for (const [gameId, { kit, raw, sim }] of Object.entries(r.kits ?? {})) {
    if (raw && kit.strengthBasis) {
      const rawHome = raw.favoredTeamId === raw.teams[0].teamId ? raw.margin : -raw.margin;
      console.log(`${gameId}  (plain margin version: home margin ${rawHome.toFixed(1)}, ${proInsightTeamAbbr(raw.favoredTeamId)} ${raw.winPct}%)`);
    }
    const [home, away] = kit.teams;
    const fav = proInsightTeamAbbr(kit.favoredTeamId);
    const kitHomeWin = kit.favoredTeamId === home.teamId ? kit.winPct : 100 - kit.winPct;
    const kitHomeMargin = kit.favoredTeamId === home.teamId ? kit.margin : -kit.margin;
    console.log(
      `${gameId}  ${proInsightTeamAbbr(away.teamId)} @ ${proInsightTeamAbbr(home.teamId)}  ` +
        `kit: ${fav} ${kit.winPct}% / home ${kitHomeWin}% margin ${kitHomeMargin.toFixed(1)} total ${kit.score.total} (${kit.score.low}-${kit.score.high})  ` +
        (sim
          ? `sim: home ${sim.homeWinPct}% margin ${sim.marginP50} total ${sim.total.p50} (${sim.total.p25}-${sim.total.p75}) sd ${sim.shockSd} lineups ${sim.lineupTeams}/2`
          : "sim: (no input)")
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
