/**
 * games.liveStats → nbaTeamShapeRecords。
 *
 *   npx tsx scripts/ingest-nba-team-shapes-from-games.ts
 *   npx tsx scripts/ingest-nba-team-shapes-from-games.ts 2026-27
 */
import fs from "fs";
import path from "path";
import { ingestNbaTeamShapesFromGames } from "../lib/nba/ingest/nbaTeamShapesIngest";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\n/)) {
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
  const result = await ingestNbaTeamShapesFromGames(getAdminDb(), {
    seasonKey,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
