/**
 * npx tsx scripts/grant-playin-2026-total-points-badges.ts
 *
 * cumulative_ranking_snapshots/play_in_totalPoints の rows を読み、
 * 1〜3位は個別バッジ、4〜20位は共通バッジを user_badges に付与する。
 *
 * ドライラン: DRY_RUN=1 npx tsx scripts/grant-playin-2026-total-points-badges.ts
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const SNAPSHOT_ID = "play_in_totalPoints";

const BADGE_BY_RANK: Record<number, string> = {
  1: "playin_2026_total_points_rank1",
  2: "playin_2026_total_points_rank2",
  3: "playin_2026_total_points_rank3",
};

const BADGE_4_20 = "playin_2026_total_points_rank4_20";

type SnapshotRow = {
  uid?: string;
  rank?: number;
};

function badgeIdForRank(rank: number): string | null {
  if (rank >= 1 && rank <= 3) return BADGE_BY_RANK[rank] ?? null;
  if (rank >= 4 && rank <= 20) return BADGE_4_20;
  return null;
}

async function main() {
  console.log("=== grant play-in 2026 total points badges ===");
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  const snap = await db
    .collection("cumulative_ranking_snapshots")
    .doc(SNAPSHOT_ID)
    .get();

  if (!snap.exists) {
    console.error(`missing snapshot: ${SNAPSHOT_ID}`);
    process.exit(1);
  }

  const rows = (snap.data()?.rows ?? []) as SnapshotRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error("snapshot rows empty");
    process.exit(1);
  }

  let batch = db.batch();
  let ops = 0;
  let granted = 0;

  for (const row of rows) {
    const uid = typeof row.uid === "string" ? row.uid : "";
    const rank =
      typeof row.rank === "number" && Number.isFinite(row.rank)
        ? Math.floor(row.rank)
        : 0;
    if (!uid || rank < 1) continue;

    const badgeId = badgeIdForRank(rank);
    if (!badgeId) continue;

    const ref = db
      .collection("user_badges")
      .doc(uid)
      .collection("badges")
      .doc(badgeId);

    console.log(`rank ${rank} -> ${uid.slice(0, 8)}… -> ${badgeId}`);

    if (!DRY_RUN) {
      batch.set(
        ref,
        {
          badgeId,
          grantedAt: FieldValue.serverTimestamp(),
          meta: {
            phase: "play_in",
            metric: "totalPoints",
            rank,
            source: "playin_2026_total_points_grant",
          },
        },
        { merge: true }
      );
      ops++;
      granted++;
      if (ops >= 450) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (!DRY_RUN && ops > 0) {
    await batch.commit();
  }

  console.log(DRY_RUN ? `would grant: ${rows.length} rows checked` : `granted: ${granted}`);
  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
