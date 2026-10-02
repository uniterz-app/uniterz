/**
 * チームエース欠場時 W–L を構築。
 *
 *   npx tsx scripts/ingest-nba-team-ace-out-records.ts
 *   npx tsx scripts/ingest-nba-team-ace-out-records.ts 2025-26
 *   npx tsx scripts/ingest-nba-team-ace-out-records.ts 2025-26 --force
 *
 * 認証: `.env.local` の FIREBASE_* と BALLDONTLIE_API_KEY
 */
import fs from "fs";
import path from "path";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { ingestNbaTeamAceOutRecords } from "../lib/nba/insights/ingestNbaTeamAceOutRecords";

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

  const result = await ingestNbaTeamAceOutRecords(getAdminDb(), {
    seasonKey,
    force,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
