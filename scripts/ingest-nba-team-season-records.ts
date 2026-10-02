/**
 * シーズン成績スプリット（home/away・H2H・対.500・対カンファ上位6）を構築。
 * games が薄いときは BDL から取る。
 *
 *   npx tsx scripts/ingest-nba-team-season-records.ts
 *   npx tsx scripts/ingest-nba-team-season-records.ts 2025-26
 *   npx tsx scripts/ingest-nba-team-season-records.ts 2026-27 --force
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 */
import fs from "fs";
import path from "path";
import { CURRENT_NBA_SEASON_KEY, previousNbaSeasonKey } from "../lib/rankings/nbaSeason";
import { loadOrBuildTeamSeasonRecords } from "../lib/nba/insights/loadPriorSeasonTeamRecords";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const force = process.argv.includes("--force");
  const seasonKey = (args[0] ?? CURRENT_NBA_SEASON_KEY).trim();
  const inProgress = seasonKey === CURRENT_NBA_SEASON_KEY;

  const result = await loadOrBuildTeamSeasonRecords(getAdminDb(), seasonKey, {
    forceRebuild: force,
    fetchFromBdlIfSparse: true,
    seasonInProgress: inProgress,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        seasonKey: result.seasonKey,
        gameCount: result.gameCount,
        teamCount: Object.keys(result.teams).length,
        h2hPairs: Object.keys(result.h2h).length,
        sample: Object.values(result.teams).slice(0, 2).map((t) => ({
          teamId: t.teamId,
          overall: t.overall,
          home: t.home,
          away: t.away,
          vsOver500: t.vsOver500,
          vsUnder500: t.vsUnder500,
          vsConfTop6: t.vsConfTop6,
        })),
        // ついでに前期も無ければ作れる案内
        tip:
          seasonKey === CURRENT_NBA_SEASON_KEY
            ? `prior: npx tsx scripts/ingest-nba-team-season-records.ts ${previousNbaSeasonKey(seasonKey)} --force`
            : null,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
