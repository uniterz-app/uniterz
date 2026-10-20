/**
 * 確定済み試合の `games.pointsSummary.top` を Top10 → Top50 に広げる（リザルト詳細の MORE 用）。
 * n / median / p90 などは触らず `pointsSummary.top` だけ差し替える。精算・ユーザー統計は触らない。
 * 既存 Top10 と並び（postId・得点）が一致しない試合は書かない（--force で上書き）。
 *
 *   npx tsx scripts/backfill-points-summary-top50.ts --dry-run
 *   npx tsx scripts/backfill-points-summary-top50.ts --dry-run --limit=5
 *   npx tsx scripts/backfill-points-summary-top50.ts
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import {
  GAME_POINTS_TOP_LIMIT,
  authorMetaFromResultPost,
  parseGamePointsTopEntries,
  type GamePointsTopEntryV1,
} from "../lib/results/gamePointsTop";
import {
  enrichGamePointsTopEntries,
  profileLiteFromUserDoc,
  type GamePointsTopProfileLite,
} from "../lib/results/enrichGamePointsTopProfiles";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** settle 済み投稿の得点（onGameFinalV2 の totalPoints と同値。再計算しない） */
function postPoints(data: Record<string, unknown>): number | null {
  const stats =
    data.stats !== null && typeof data.stats === "object"
      ? (data.stats as Record<string, unknown>)
      : null;
  if (!stats) return null;
  if (isFiniteNum(stats.pointsV3)) return stats.pointsV3;
  const detail =
    stats.pointsV3Detail !== null && typeof stats.pointsV3Detail === "object"
      ? (stats.pointsV3Detail as Record<string, unknown>)
      : null;
  if (detail && isFiniteNum(detail.totalPoints)) return detail.totalPoints;
  return null;
}

function stripUndefined<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(
    Object.entries(row).filter(([, v]) => v !== undefined)
  ) as T;
}

async function main() {
  const db = getAdminDb();
  console.log(
    `=== backfill pointsSummary.top → ${GAME_POINTS_TOP_LIMIT} ===${DRY_RUN ? " (DRY RUN)" : ""}`
  );

  const gamesSnap = await db
    .collection("games")
    .where("pointsSummary.n", ">", 10)
    .get();
  console.log(`games with pointsSummary.n > 10: ${gamesSnap.size}`);

  const stats = {
    scanned: 0,
    updated: 0,
    alreadyFull: 0,
    mismatch: 0,
    noScores: 0,
    postsRead: 0,
  };

  for (const gameDoc of gamesSnap.docs) {
    if (stats.scanned >= LIMIT) break;
    stats.scanned += 1;
    const game = gameDoc.data() as Record<string, unknown>;
    const summary = (game.pointsSummary ?? {}) as Record<string, unknown>;
    const n = isFiniteNum(summary.n) ? summary.n : 0;
    const existingTop = parseGamePointsTopEntries(summary.top);
    const target = Math.min(n, GAME_POINTS_TOP_LIMIT);
    if (existingTop.length >= target) {
      stats.alreadyFull += 1;
      continue;
    }

    const postsSnap = await db
      .collection("posts")
      .where("gameId", "==", gameDoc.id)
      .where("schemaVersion", "==", 2)
      .get();
    stats.postsRead += postsSnap.size;

    const rows: GamePointsTopEntryV1[] = [];
    for (const postDoc of postsSnap.docs) {
      const p = postDoc.data() as Record<string, unknown>;
      const pts = postPoints(p);
      if (pts == null) continue;
      const author = authorMetaFromResultPost(p);
      rows.push({
        rank: 0,
        postId: postDoc.id,
        uid: author.uid,
        handle: author.handle,
        displayName: author.displayName,
        photoURL: author.photoURL,
        isPro: author.isPro,
        points: pts,
        countryCode: author.countryCode,
      });
    }
    if (rows.length === 0) {
      stats.noScores += 1;
      console.log(`[skip no scores] ${gameDoc.id}`);
      continue;
    }

    const topRaw = rows
      .sort((a, b) => b.points - a.points || a.postId.localeCompare(b.postId))
      .slice(0, GAME_POINTS_TOP_LIMIT)
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const mismatchAt = existingTop.findIndex((prev, i) => {
      const next = topRaw[i];
      return (
        !next ||
        next.postId !== prev.postId ||
        Math.abs(next.points - prev.points) > 1e-6
      );
    });
    if (mismatchAt >= 0 && !FORCE) {
      stats.mismatch += 1;
      const prev = existingTop[mismatchAt];
      const next = topRaw[mismatchAt];
      console.log(
        `[skip mismatch] ${gameDoc.id} rank=${mismatchAt + 1} stored=${prev.postId}:${prev.points} rebuilt=${next?.postId}:${next?.points}`
      );
      continue;
    }

    const uids = [
      ...new Set(topRaw.map((r) => r.uid?.trim() || "").filter(Boolean)),
    ];
    const profiles = new Map<string, GamePointsTopProfileLite>();
    if (uids.length > 0) {
      const snaps = await db.getAll(
        ...uids.map((uid) => db.collection("users").doc(uid))
      );
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const lite = profileLiteFromUserDoc(
          snap.data() as Record<string, unknown>
        );
        if (lite) profiles.set(snap.id, lite);
      }
    }
    const top = enrichGamePointsTopEntries(topRaw, profiles).map((row) =>
      stripUndefined(row as unknown as Record<string, unknown>)
    );

    stats.updated += 1;
    console.log(
      `[${DRY_RUN ? "dry" : "write"}] ${gameDoc.id} n=${n} top ${existingTop.length} → ${top.length}`
    );
    if (!DRY_RUN) {
      await gameDoc.ref.update({
        "pointsSummary.top": top,
        "pointsSummary.updatedAtMillis": Date.now(),
      });
    }
  }

  console.log(JSON.stringify({ ...stats, dryRun: DRY_RUN }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
