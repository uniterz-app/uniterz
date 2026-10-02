/**
 * BDL → Firestore リーグ Team / Player スナップショット ingest。
 *
 * 実行（リポジトリルート）:
 *   npx tsx scripts/ingest-nba-league-stats-from-bdl.ts
 *   npx tsx scripts/ingest-nba-league-stats-from-bdl.ts 2025-26
 *   npx tsx scripts/ingest-nba-league-stats-from-bdl.ts 2026-27 7
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 *
 * 第2引数 lookbackSeasons（例: 7 → `2020-21`〜今季）で複数シーズン
 * （各シーズン regular + playoffs）を順に書く。重いのでタイムアウト注意。
 */
import fs from "fs";
import path from "path";
import {
  ingestNbaLeagueStatsFromProvider,
  NBA_LEAGUE_STATS_SEASON_LOOKBACK,
} from "../lib/nba/ingest/nbaLeagueStatsIngest";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

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
  const seasonKey = (process.argv[2] ?? CURRENT_NBA_SEASON_KEY).trim();
  const lookbackRaw = process.argv[3];
  const lookbackSeasons =
    lookbackRaw != null && lookbackRaw.trim() !== ""
      ? Number.parseInt(lookbackRaw, 10)
      : undefined;
  const result = await ingestNbaLeagueStatsFromProvider(getAdminDb(), {
    seasonKey,
    lookbackSeasons: Number.isFinite(lookbackSeasons)
      ? lookbackSeasons
      : undefined,
  });
  console.log(
    JSON.stringify(
      {
        ...result,
        tip:
          lookbackSeasons == null
            ? `再実行で過去${NBA_LEAGUE_STATS_SEASON_LOOKBACK}シーズン: npx tsx scripts/ingest-nba-league-stats-from-bdl.ts ${seasonKey} ${NBA_LEAGUE_STATS_SEASON_LOOKBACK}`
            : undefined,
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
