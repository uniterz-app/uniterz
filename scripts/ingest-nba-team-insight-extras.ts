/**
 * Pro Insight 用チーム負荷／帯スプリットを Firestore に保存。
 *
 *   npx tsx scripts/ingest-nba-team-insight-extras.ts
 *   npx tsx scripts/ingest-nba-team-insight-extras.ts 2025-26 --force
 *   npx tsx scripts/ingest-nba-team-insight-extras.ts 2025-26 --force --h2hYears=3
 *
 * 認証: `.env.local` の FIREBASE_*（H2H 用に season-records が無ければ BDL も使用）
 */
import fs from "fs";
import path from "path";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { ingestNbaTeamInsightExtras } from "../lib/nba/insights/ingestNbaTeamInsightExtras";

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
  const h2hArg = process.argv.find((a) => a.startsWith("--h2hYears="));
  const h2hLookbackSeasons = h2hArg
    ? Number(h2hArg.split("=")[1])
    : 3;
  const seasonKey = (args[0] ?? CURRENT_NBA_SEASON_KEY).trim();

  const result = await ingestNbaTeamInsightExtras(getAdminDb(), {
    seasonKey,
    force,
    h2hLookbackSeasons: Number.isFinite(h2hLookbackSeasons)
      ? h2hLookbackSeasons
      : 3,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
