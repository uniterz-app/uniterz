/**
 * プレーイン（play_in）総合得点ランキングに応じてバッジを付与する。
 *
 * 前提:
 * - `cumulative_ranking_snapshots/play_in_totalPoints` が最新であること
 *   （Cloud Functions `buildCumulativeRankingSnapshotCron`、または手動でスナップショット生成後）
 * - `master_badges` に定義があること →先に
 *   `npx tsx scripts/seed-playin-2026-total-points-badges.ts`
 *
 * 付与ルール（rows[].rank ）:
 * - 1位 → playin_2026_total_points_rank1（画像1st.png）
 * - 2位 → playin_2026_total_points_rank2（2nd.png）
 * - 3位 → playin_2026_total_points_rank3（3rd.png）
 * - 4〜20位 → playin_2026_total_points_rank4_20（top20.png）
 *
 * 実行:
 *   DRY_RUN=1 npx tsx scripts/grant-playin-2026-total-points-badges.ts  # 確認のみ
 *   npx tsx scripts/grant-playin-2026-total-points-badges.ts            # 本番書き込み
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
  /** 1〜20位でバッジ対象になった行数（DRY_RUN でもカウント） */
  let eligible = 0;
  const summary = new Map<string, number>();

  for (const row of rows) {
    const uid = typeof row.uid === "string" ? row.uid : "";
    const rank =
      typeof row.rank === "number" && Number.isFinite(row.rank)
        ? Math.floor(row.rank)
        : 0;
    if (!uid || rank < 1) continue;

    const badgeId = badgeIdForRank(rank);
    if (!badgeId) continue;
    eligible++;

    const ref = db
      .collection("user_badges")
      .doc(uid)
      .collection("badges")
      .doc(badgeId);

    console.log(`rank ${rank} -> ${uid.slice(0, 8)}… -> ${badgeId}`);
    summary.set(badgeId, (summary.get(badgeId) ?? 0) + 1);

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

  const inTop20 = rows.filter((r) => {
    const rk =
      typeof r.rank === "number" && Number.isFinite(r.rank)
        ? Math.floor(r.rank)
        : 0;
    return rk >= 1 && rk <= 20;
  }).length;
  if (inTop20 < 20) {
    console.warn(
      `note: only ${inTop20} rows in ranks 1–20 (snapshot may have fewer users with play_in posts).`
    );
  }

  console.log(DRY_RUN ? "dry-run summary (by badgeId):" : "granted summary (by badgeId):");
  for (const [id, n] of [...summary.entries()].sort()) {
    console.log(`  ${id}: ${n}`);
  }
  console.log(
    DRY_RUN
      ? `dry-run: ${eligible} user(s) would receive a badge (no writes)`
      : `committed grant writes: ${granted} (eligible rows: ${eligible})`
  );
  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
