/**
 * プレーオフ通算（rankingByPhase.playoffs）の総合得点順位に応じて Po All バッジを付与する。
 *
 * 順位は `cumulative_stats` を全件読み、`rankingByPhase.playoffs` で
 * Cloud Functions `buildCumulativeRankingSnapshot` と同じ並び・競技順位で再計算する。
 *
 * ━━━ 手順（リポジトリ直下・service-account.json がある状態）━━━
 * 1. master は未投入なら一度だけ: `npm run badges:poall:seed`
 * 2. 件数確認: `npm run badges:poall:grant:dry`
 * 3. 本番付与: `npm run badges:poall:grant`
 *
 * 付与ルール（競技順位 rank）:
 * - 1位 → po_2026_all_total_points_rank1
 * - 2位 → po_2026_all_total_points_rank2
 * - 3位 → po_2026_all_total_points_rank3
 * - 4〜20位 → po_2026_all_total_points_top20
 * - 21〜50位 → po_2026_all_total_points_top50
 *
 * CLI:
 *   DRY_RUN=1 npx tsx scripts/grant-po-2026-all-total-points-badges.ts
 *   npx tsx scripts/grant-po-2026-all-total-points-badges.ts
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import fs from "fs";
import { stampMasterBadgeParticipantCount } from "../../lib/badges/server/stampMasterBadgeParticipantCount";

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
  1: "po_2026_all_total_points_rank1",
  2: "po_2026_all_total_points_rank2",
  3: "po_2026_all_total_points_rank3",
};

const BADGE_4_TO_20 = "po_2026_all_total_points_top20";
const BADGE_21_TO_50 = "po_2026_all_total_points_top50";

type PlayoffsRow = {
  uid: string;
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
};

function rowFromDoc(doc: QueryDocumentSnapshot): PlayoffsRow | null {
  const d = doc.data();
  const rr = d.rankingByPhase?.playoffs as
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

/** CF `cmpSortRows`（metric = totalPoints）と同一 */
function cmpPlayoffsTotalPoints(a: PlayoffsRow, b: PlayoffsRow): number {
  const diff = b.totalPoints - a.totalPoints;
  if (diff !== 0) return diff;
  return b.totalPoints - a.totalPoints;
}

/** CF `assignCompetitionRanks` と同一 */
function assignRanks(sorted: PlayoffsRow[]): Map<string, number> {
  const out = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]!;
    if (i > 0 && cmpPlayoffsTotalPoints(sorted[i - 1]!, row) !== 0) {
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
  console.log("=== grant PO 2026 All (playoffs overall) total points badges ===");
  console.log(
    "ranking: live from rankingByPhase.playoffs (same rules as snapshot builder)"
  );
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  const snap = await db.collection("cumulative_stats").get();
  const rows: PlayoffsRow[] = [];
  for (const doc of snap.docs) {
    const r = rowFromDoc(doc);
    if (r) rows.push(r);
  }

  const sorted = [...rows].sort(cmpPlayoffsTotalPoints);
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

    const row = sorted.find((r) => r.uid === uid);
    console.log(
      `rank ${rank} -> ${uid.slice(0, 8)}… (${row?.totalPoints ?? "?"} pts) -> ${badgeId}`
    );
    summary.set(badgeId, (summary.get(badgeId) ?? 0) + 1);

    if (!DRY_RUN) {
      batch.set(
        ref,
        {
          badgeId,
          grantedAt: FieldValue.serverTimestamp(),
          meta: {
            phase: "playoffs_all",
            metric: "totalPoints",
            round: "overall",
            rank,
            participantCount: rows.length,
            source: "po_2026_all_total_points_grant",
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

  if (!DRY_RUN) {
    await stampMasterBadgeParticipantCount(db, summary.keys(), rows.length);
  }

  console.log(
    `participants with playoffs posts: ${rows.length} (cumulative_stats docs scanned: ${snap.size})`
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
