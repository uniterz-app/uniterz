/**
 * BDL standings → Firestore `nbaStandings/{seasonKey}`。
 * BDL が空の開幕前は 30 チーム 0-0（preseason）を書く。
 *
 *   npx tsx scripts/ingest-nba-standings-from-bdl.ts
 *   npx tsx scripts/ingest-nba-standings-from-bdl.ts 2026-27
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 */
import fs from "fs";
import path from "path";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { ingestNbaStandingsFromBdl } from "../lib/nba/ingest/nbaStandingsIngest";

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
  const seasonKey = (args[0] ?? CURRENT_NBA_SEASON_KEY).trim();

  const result = await ingestNbaStandingsFromBdl(getAdminDb(), { seasonKey });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
