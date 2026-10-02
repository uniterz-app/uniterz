/**
 * 共有スナップショット doc をモックで seed（ingest 実装前の動作確認用）。
 *
 * 実行: npx tsx scripts/seed-nba-league-team-stats-snapshot.ts
 * 前提: リポジトリルートに service-account.json
 *
 * 契約後は `ingestNbaLeagueStatsFromProvider` が同じ writer を使う。
 */
import adminPkg from "firebase-admin";
import fs from "fs";
import { getNbaLeagueTeamStatsMock } from "../lib/predict/nbaLeagueTeamStatsMocks";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import {
  NBA_LEAGUE_TEAM_STATS_COLLECTION,
  writeLeagueTeamStatsSnapshot,
} from "../lib/nba/leagueTeamStats/loadLeagueTeamStatsSnapshot";

const admin = adminPkg;

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  const bundle = getNbaLeagueTeamStatsMock();
  const seasonKey = CURRENT_NBA_SEASON_KEY;
  await writeLeagueTeamStatsSnapshot(
    db,
    seasonKey,
    bundle,
    "mock",
    admin.firestore.FieldValue.serverTimestamp()
  );
  console.log(`Wrote ${NBA_LEAGUE_TEAM_STATS_COLLECTION}/${seasonKey}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
