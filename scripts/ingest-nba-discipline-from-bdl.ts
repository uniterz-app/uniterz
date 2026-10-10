/**
 * テクニカル / フラグラント / 退場を BDL play-by-play から集計（未処理の終了試合のみ）。
 *
 *   npx tsx scripts/ingest-nba-discipline-from-bdl.ts                 # 今季
 *   npx tsx scripts/ingest-nba-discipline-from-bdl.ts 2022-23
 *   npx tsx scripts/ingest-nba-discipline-from-bdl.ts --all           # 2020-21 → 今季
 *   npx tsx scripts/ingest-nba-discipline-from-bdl.ts 2022-23 --max=20 --force
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 */
import fs from "fs";
import path from "path";
import {
  CURRENT_NBA_SEASON_KEY,
  nbaLeagueStatsSeasonKeys,
} from "../lib/rankings/nbaSeason";
import { ingestNbaDisciplineFromBdl } from "../lib/nba/ingest/nbaDisciplineIngest";

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
  const all = process.argv.includes("--all");
  const maxArg = process.argv.find((a) => a.startsWith("--max="));
  const maxGames = maxArg ? Number(maxArg.slice("--max=".length)) : undefined;

  const seasons = all
    ? [...nbaLeagueStatsSeasonKeys()].reverse()
    : [(args[0] ?? CURRENT_NBA_SEASON_KEY).trim()];

  for (const seasonKey of seasons) {
    const t0 = Date.now();
    const result = await ingestNbaDisciplineFromBdl(getAdminDb(), {
      seasonKey,
      force,
      maxGames,
      concurrency: 8,
    });
    console.log(
      JSON.stringify({ ...result, sec: Math.round((Date.now() - t0) / 1000) })
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
