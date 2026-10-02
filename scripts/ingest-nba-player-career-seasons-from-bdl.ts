/**
 * BDL → Firestore `nbaPlayerCareerSeasons/{playerId}`。
 *
 *   npx tsx scripts/ingest-nba-player-career-seasons-from-bdl.ts
 *   npx tsx scripts/ingest-nba-player-career-seasons-from-bdl.ts 2026-27
 *   npx tsx scripts/ingest-nba-player-career-seasons-from-bdl.ts 2026-27 175
 *   npx tsx scripts/ingest-nba-player-career-seasons-from-bdl.ts 2026-27 175,237
 *   npx tsx scripts/ingest-nba-player-career-seasons-from-bdl.ts 2026-27 --min-career-years=15
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 */
import fs from "fs";
import path from "path";
import { ingestNbaPlayerCareerSeasonsFromBdl } from "../lib/nba/ingest/nbaPlayerCareerSeasonsIngest";
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
  const args = process.argv.slice(2);
  let seasonKey = CURRENT_NBA_SEASON_KEY;
  let playerIds: string[] | undefined;
  let minCareerYears: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--min-career-years=")) {
      const n = Number(arg.slice("--min-career-years=".length));
      if (Number.isFinite(n) && n > 0) minCareerYears = Math.trunc(n);
      continue;
    }
    if (/^\d{4}-\d{2}$/.test(arg)) {
      seasonKey = arg;
      continue;
    }
    if (/^\d/.test(arg) || arg.includes(",")) {
      playerIds = arg
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const result = await ingestNbaPlayerCareerSeasonsFromBdl(getAdminDb(), {
    seasonKey,
    playerIds,
    minCareerYears,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
