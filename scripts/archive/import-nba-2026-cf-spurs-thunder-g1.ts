/**
 * CF Spurs @ Thunder Game 1 結果を Firestore games に反映
 *
 *   npx tsx scripts/import-nba-2026-cf-spurs-thunder-g1.ts
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import fs from "fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function toJstTimestamp(isoString: string) {
  return admin.firestore.Timestamp.fromDate(new Date(isoString));
}

type GameImport = {
  id: string;
  league: string;
  startAtJstIso: string;
  season: string;
  venue: string;
  roundLabel: string;
  seasonPhase: string;
  countsForRanking: boolean;
  playoffRound: string;
  home: { name: string; teamId: string };
  away: { name: string; teamId: string };
  status: string;
  final: boolean;
  homeScore: number;
  awayScore: number;
  score: { home: number; away: number };
  seriesStanding: { homeWins: number; awayWins: number };
  injuries: { home: string[]; away: string[] };
  summaryJa: string;
};

async function main() {
  const path = resolve(
    process.cwd(),
    "tools/nba-2026-playoffs-cf-spurs-thunder-g1.json"
  );
  const games = JSON.parse(readFileSync(path, "utf8")) as GameImport[];

  for (const g of games) {
    const startAtTs = toJstTimestamp(g.startAtJstIso);
    await db.collection("games").doc(g.id).set(
      {
        ...g,
        startAt: startAtTs,
        startAtJst: startAtTs,
        resultComputedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
    console.log(`ok imported ${g.id} (${g.away.teamId} ${g.awayScore} @ ${g.home.teamId} ${g.homeScore})`);
  }

  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
