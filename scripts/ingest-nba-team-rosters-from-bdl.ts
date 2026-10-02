/**
 * BDL → Firestore チーム別アクティブロスター ingest。
 *
 *   npx tsx scripts/ingest-nba-team-rosters-from-bdl.ts
 *   npx tsx scripts/ingest-nba-team-rosters-from-bdl.ts 2026-27
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 */
import fs from "fs";
import path from "path";
import { ingestNbaTeamRostersFromBdl } from "../lib/nba/ingest/nbaTeamRostersIngest";
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
  const result = await ingestNbaTeamRostersFromBdl(getAdminDb(), {
    seasonKey,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
