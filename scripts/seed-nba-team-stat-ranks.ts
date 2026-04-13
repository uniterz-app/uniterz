/**
 * NBA 全チームのスタッツからリーグ順位を計算し teams に merge 書き込み（1回実行想定）。
 * ppgRank / papgRank / diffRank / ofrtgRank / dfrtgRank / netrtgRank
 *
 * ofrtg/dfrtg/netrtg を先に入れておく: npx tsx scripts/seed-nba-team-ortg-dfrtg-netrtg.ts
 *
 * 前提: リポジトリルートに service-account.json
 * 実行: npx tsx scripts/seed-nba-team-stat-ranks.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { computeNbaTeamStatLeagueRanks } from "../lib/nba/computeNbaTeamStatLeagueRanks";

const admin = adminPkg;

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

type TeamRow = {
  gamesPlayed: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;
  ofrtg?: number;
  dfrtg?: number;
  netrtg?: number;
};

function readRtg(t: TeamRow): {
  ofrtg: number;
  dfrtg: number;
  netrtg: number;
} | null {
  if (
    typeof t.ofrtg !== "number" ||
    typeof t.dfrtg !== "number" ||
    typeof t.netrtg !== "number" ||
    !Number.isFinite(t.ofrtg) ||
    !Number.isFinite(t.dfrtg) ||
    !Number.isFinite(t.netrtg)
  ) {
    return null;
  }
  return { ofrtg: t.ofrtg, dfrtg: t.dfrtg, netrtg: t.netrtg };
}

async function main() {
  console.log("=== seed NBA stat ranks (ppg / papg / diff / ortg fields) ===");
  const snap = await db
    .collection("teams")
    .where("league", "==", "nba")
    .get();

  const ranks = computeNbaTeamStatLeagueRanks(
    snap.docs.map((d) => {
      const t = d.data() as TeamRow;
      const rtg = readRtg(t);
      return {
        id: d.id,
        gamesPlayed: Number(t.gamesPlayed ?? 0),
        pointsForTotal: Number(t.pointsForTotal ?? 0),
        pointsAgainstTotal: Number(t.pointsAgainstTotal ?? 0),
        ofrtg: rtg?.ofrtg,
        dfrtg: rtg?.dfrtg,
        netrtg: rtg?.netrtg,
      };
    })
  );

  let batch = db.batch();
  let n = 0;
  for (const d of snap.docs) {
    const r = ranks[d.id];
    if (!r) continue;
    const ref = d.ref;
    const payload: Record<string, number> = {};
    if (r.ppg != null) payload.ppgRank = r.ppg;
    if (r.papg != null) payload.papgRank = r.papg;
    if (r.diff != null) payload.diffRank = r.diff;
    if (r.ofrtg != null) payload.ofrtgRank = r.ofrtg;
    if (r.dfrtg != null) payload.dfrtgRank = r.dfrtg;
    if (r.netrtg != null) payload.netrtgRank = r.netrtg;
    if (Object.keys(payload).length === 0) continue;
    batch.set(
      ref,
      {
        ...payload,
        statRanksUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    n++;
    if (n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`OK: merged ranks on ${n} team docs`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
