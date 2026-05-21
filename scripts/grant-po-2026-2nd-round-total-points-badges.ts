/**
 * プレーオフ 2nd Round（rankingByPlayoffRound.r2）の総合得点順位に応じてバッジを付与する。
 *
 * 順位は `cumulative_stats` を全件読み、`rankingByPlayoffRound.r2` で
 * Cloud Functions `buildCumulativeRankingSnapshot` と同じ並び・競技順位で再計算する。
 *
 * ━━━ すぐ付与するとき（リポジトリ直下・service-account.json がある状態）━━━
 * 1. master は未投入なら一度だけ: `npm run badges:po2:seed`
 * 2. 件数確認: `npm run badges:po2:grant:dry`
 * 3. 本番付与: `npm run badges:po2:grant`
 *
 * 付与ルール（競技順位 rank）:
 * - 1位 → po_2026_2nd_round_total_points_rank1
 * - 2位 → po_2026_2nd_round_total_points_rank2
 * - 3位 → po_2026_2nd_round_total_points_rank3
 * - 4〜20位 → po_2026_2nd_round_total_points_top20
 * - 21〜50位 → po_2026_2nd_round_total_points_top50
 *
 * CLI 直叩き:
 *   DRY_RUN=1 npx tsx scripts/grant-po-2026-2nd-round-total-points-badges.ts
 *   npx tsx scripts/grant-po-2026-2nd-round-total-points-badges.ts
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
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

const TOP_RANK_MAX = 50;

const BADGE_BY_RANK: Record<number, string> = {
  1: "po_2026_2nd_round_total_points_rank1",
  2: "po_2026_2nd_round_total_points_rank2",
  3: "po_2026_2nd_round_total_points_rank3",
};

const BADGE_4_TO_20 = "po_2026_2nd_round_total_points_top20";
const BADGE_21_TO_50 = "po_2026_2nd_round_total_points_top50";

type R2Row = {
  uid: string;
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
};

function rowFromDoc(doc: QueryDocumentSnapshot): R2Row | null {
  const d = doc.data();
  const rr = d.rankingByPlayoffRound?.r2 as
    | {
        totalPosts?: number;
        totalWins?: number;
        winRate?: number;
        totalPoints?: number;
      }
    | undefined;
  if (!rr) return null;
  const tp = rr.totalPosts ?? 0;
  if (tp <= 0) return null;
  const tw = rr.totalWins ?? 0;
  return {
    uid: doc.id,
    totalPosts: tp,
    totalWins: tw,
    winRate: tp > 0 ? tw / tp : (rr.winRate ?? 0),
    totalPoints: rr.totalPoints ?? 0,
  };
}

/** CF `cmpSortRows` と同一（metric = totalPoints） */
function cmpR2TotalPoints(a: R2Row, b: R2Row): number {
  const diff = b.totalPoints - a.totalPoints;
  if (diff !== 0) return diff;
  return b.totalPoints - a.totalPoints;
}

/** CF `assignCompetitionRanks` と同一 */
function assignRanks(sorted: R2Row[]): Map<string, number> {
  const out = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]!;
    if (i > 0 && cmpR2TotalPoints(sorted[i - 1]!, row) !== 0) {
      rank = i + 1;
    }
    out.set(row.uid, rank);
  }
  return out;
}

function badgeIdForRank(rank: number): string | null {
  if (rank >= 1 && rank <= 3) return BADGE_BY_RANK[rank] ?? null;
  if (rank >= 4 && rank <= 20) return BADGE_4_TO_20;
  if (rank >= 21 && rank <= TOP_RANK_MAX) return BADGE_21_TO_50;
  return null;
}

async function main() {
  console.log("=== grant PO 2026 2nd round total points badges ===");
  console.log(
    "ranking: live from rankingByPlayoffRound.r2 (same rules as snapshot builder)"
  );
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  const snap = await db.collection("cumulative_stats").get();
  const rows: R2Row[] = [];
  for (const doc of snap.docs) {
    const r = rowFromDoc(doc);
    if (r) rows.push(r);
  }

  const sorted = [...rows].sort(cmpR2TotalPoints);
  const ranks = assignRanks(sorted);

  let batch = db.batch();
  let ops = 0;
  let granted = 0;
  let eligible = 0;
  const summary = new Map<string, number>();

  for (const [uid, rank] of ranks) {
    if (rank < 1 || rank > TOP_RANK_MAX) continue;

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
            phase: "playoffs",
            metric: "totalPoints",
            round: "r2",
            rank,
            source: "po_2026_2nd_round_total_points_grant",
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

  console.log(
    `participants with r2 posts: ${rows.length} (cumulative_stats docs scanned: ${snap.size})`
  );
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
