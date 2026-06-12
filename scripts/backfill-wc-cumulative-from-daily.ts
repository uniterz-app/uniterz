/**
 * 確定済み WC 投稿 + games.resolveWcStageFromGame から
 * user_stats_v2_daily.rankingByWcStage と cumulative_stats.rankingByWcStage を再構築する。
 * （daily の誤った main 加算を game.wcStage 直読みの旧ロジックから修正）
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts --dry-run
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts --uid=<UID>
 *   npx tsx scripts/backfill-wc-cumulative-from-daily.ts
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { Timestamp } from "firebase-admin/firestore";
import {
  WC_RANKING_STAGES,
  type WcRankingStageBucket,
} from "../lib/rankings/dailyWcStageBuckets";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const targetUid = uidArg ? uidArg.slice("--uid=".length).trim() : "";

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

type Bucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  upsetOpportunityCount: number;
  upsetHitCount: number;
  upsetPickCount: number;
  scorePrecisionSum: number;
  pointsSumV3: number;
  upsetPointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  goalScorerHitCount: number;
  goalScorerBonusSum: number;
};

type RankingTotals = {
  totalPosts: number;
  totalWins: number;
  totalPoints: number;
  totalUpset: number;
  totalPrecision: number;
  totalGoalScorerHits: number;
  winRate: number;
};

function emptyBucket(): Bucket {
  return {
    posts: 0,
    wins: 0,
    scoreErrorSum: 0,
    upsetOpportunityCount: 0,
    upsetHitCount: 0,
    upsetPickCount: 0,
    scorePrecisionSum: 0,
    pointsSumV3: 0,
    upsetPointsSum: 0,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    goalScorerHitCount: 0,
    goalScorerBonusSum: 0,
  };
}

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function addBucket(base: Bucket, inc: Bucket): Bucket {
  return {
    posts: base.posts + inc.posts,
    wins: base.wins + inc.wins,
    scoreErrorSum: base.scoreErrorSum + inc.scoreErrorSum,
    upsetOpportunityCount:
      base.upsetOpportunityCount + inc.upsetOpportunityCount,
    upsetHitCount: base.upsetHitCount + inc.upsetHitCount,
    upsetPickCount: base.upsetPickCount + inc.upsetPickCount,
    scorePrecisionSum: base.scorePrecisionSum + inc.scorePrecisionSum,
    pointsSumV3: base.pointsSumV3 + inc.pointsSumV3,
    upsetPointsSum: base.upsetPointsSum + inc.upsetPointsSum,
    upsetBonusSum: base.upsetBonusSum + inc.upsetBonusSum,
    streakBonusSum: base.streakBonusSum + inc.streakBonusSum,
    goalScorerHitCount: base.goalScorerHitCount + inc.goalScorerHitCount,
    goalScorerBonusSum: base.goalScorerBonusSum + inc.goalScorerBonusSum,
  };
}

function bucketFromPostStats(stats: Record<string, unknown>): Bucket {
  const goalScorerBonus = safeNum(stats.goalScorerBonus);
  return {
    posts: 1,
    wins: stats.isWin === true ? 1 : 0,
    scoreErrorSum: safeNum(stats.scoreError),
    upsetOpportunityCount: stats.hadUpsetGame === true ? 1 : 0,
    upsetHitCount: stats.upsetHit === true ? 1 : 0,
    upsetPickCount: stats.hadUpsetGame === true ? 1 : 0,
    scorePrecisionSum: safeNum(stats.scorePrecision),
    pointsSumV3: safeNum(stats.pointsV3),
    upsetPointsSum: safeNum(stats.upsetPoints),
    upsetBonusSum: safeNum(stats.upsetBonus),
    streakBonusSum: safeNum(stats.streakBonus),
    goalScorerHitCount: goalScorerBonus > 0 ? 1 : 0,
    goalScorerBonusSum: goalScorerBonus,
  };
}

function bucketToRankingTotals(bucket: Bucket): RankingTotals {
  return {
    totalPosts: bucket.posts,
    totalWins: bucket.wins,
    totalPoints: bucket.pointsSumV3,
    totalUpset: bucket.upsetPointsSum,
    totalPrecision: bucket.scorePrecisionSum,
    totalGoalScorerHits: bucket.goalScorerHitCount,
    winRate: bucket.posts > 0 ? bucket.wins / bucket.posts : 0,
  };
}

function emptyStageBuckets(): Record<WcRankingStageBucket, Bucket> {
  return {
    overall: emptyBucket(),
    qualifying: emptyBucket(),
    main: emptyBucket(),
  };
}

function toDateKeyJST(ts: Timestamp): string {
  const d = ts.toDate();
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  return null;
}

/** finalizePost / applyPostToUserStatsV2 と同じ startAt 解決 */
function resolveStatsStartAt(
  post: Record<string, unknown>,
  game?: Record<string, unknown>
): Timestamp | null {
  return (
    toTimestamp(game?.startAtJst) ??
    toTimestamp(game?.startAt) ??
    toTimestamp(post.startAtJst) ??
    toTimestamp(post.startAt) ??
    toTimestamp(post.createdAt)
  );
}

function dailyWcStageHasPosts(data: Record<string, unknown> | undefined): boolean {
  if (!data) return false;
  const nested = data.rankingByWcStage as Record<string, { posts?: unknown }> | undefined;
  if (nested) {
    for (const stage of WC_RANKING_STAGES) {
      if (safeNum(nested[stage]?.posts) > 0) return true;
    }
  }
  for (const stage of WC_RANKING_STAGES) {
    const prefix = `rankingByWcStage.${stage}.posts`;
    if (safeNum(data[prefix]) > 0) return true;
  }
  return false;
}

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

function applyPostToStageBuckets(
  buckets: Record<WcRankingStageBucket, Bucket>,
  inc: Bucket,
  stage: ReturnType<typeof resolveWcStageFromGame>
) {
  buckets.overall = addBucket(buckets.overall, inc);
  if (stage === "qualifying") {
    buckets.qualifying = addBucket(buckets.qualifying, inc);
  } else if (stage === "main") {
    buckets.main = addBucket(buckets.main, inc);
  }
}

function stageBucketsToRankingByWcStage(
  buckets: Record<WcRankingStageBucket, Bucket>
): Record<WcRankingStageBucket, RankingTotals> {
  return {
    overall: bucketToRankingTotals(buckets.overall),
    qualifying: bucketToRankingTotals(buckets.qualifying),
    main: bucketToRankingTotals(buckets.main),
  };
}

(async () => {
  console.log(
    "=== backfill WC rankingByWcStage from finalized posts + games ==="
  );
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const postsSnap = await db
    .collection("posts")
    .where("schemaVersion", "==", 2)
    .where("status", "==", "final")
    .get();

  const gameIds = new Set<string>();
  for (const doc of postsSnap.docs) {
    const p = doc.data();
    if (normalizeLeague(p.league) !== "wc") continue;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;
    const uid = String(p.authorUid ?? "").trim();
    if (targetUid && uid !== targetUid) continue;
    const gameId = String(p.gameId ?? "").trim();
    if (gameId) gameIds.add(gameId);
  }

  const gameById = new Map<string, Record<string, unknown>>();
  const gameIdList = [...gameIds];
  for (let i = 0; i < gameIdList.length; i += 300) {
    const chunk = gameIdList.slice(i, i + 300);
    const refs = chunk.map((id) => db.doc(`games/${id}`));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) gameById.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }

  const cumulativeByUid = new Map<
    string,
    Record<WcRankingStageBucket, Bucket>
  >();
  const dailyByKey = new Map<string, Record<WcRankingStageBucket, Bucket>>();

  let scanned = 0;
  let counted = 0;

  for (const doc of postsSnap.docs) {
    scanned++;
    const p = doc.data();
    if (normalizeLeague(p.league) !== "wc") continue;

    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;

    const uid = String(p.authorUid ?? "").trim();
    if (!uid || (targetUid && uid !== targetUid)) continue;

    const gameId = String(p.gameId ?? "").trim();
    const game = gameId ? gameById.get(gameId) : undefined;
    const startAt = resolveStatsStartAt(p, game);
    if (!startAt) continue;
    const stage = resolveWcStageFromGame({
      knockout: game?.knockout === true,
      roundLabel:
        typeof game?.roundLabel === "string" ? game.roundLabel : null,
      wcStage: typeof game?.wcStage === "string" ? game.wcStage : null,
    });

    const inc = bucketFromPostStats(stats);
    const dateKey = toDateKeyJST(startAt);
    const dailyKey = `${uid}_${dateKey}`;

    if (!cumulativeByUid.has(uid)) {
      cumulativeByUid.set(uid, emptyStageBuckets());
    }
    if (!dailyByKey.has(dailyKey)) {
      dailyByKey.set(dailyKey, emptyStageBuckets());
    }

    applyPostToStageBuckets(cumulativeByUid.get(uid)!, inc, stage);
    applyPostToStageBuckets(dailyByKey.get(dailyKey)!, inc, stage);
    counted++;
  }

  console.log(`scanned=${scanned} wcPosts=${counted} users=${cumulativeByUid.size}`);

  let updated = 0;
  for (const [uid, buckets] of cumulativeByUid) {
    const rankingByWcStage = stageBucketsToRankingByWcStage(buckets);
    const hasAny = WC_RANKING_STAGES.some(
      (s) => rankingByWcStage[s].totalPosts > 0
    );
    if (!hasAny) continue;

    console.log(
      `${uid}: overall=${rankingByWcStage.overall.totalPosts} qualifying=${rankingByWcStage.qualifying.totalPosts} main=${rankingByWcStage.main.totalPosts}`
    );

    if (!DRY_RUN) {
      await db.doc(`cumulative_stats/${uid}`).set(
        {
          rankingByWcStage,
          wcRankingBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    updated += 1;
  }

  let dailyUpdated = 0;
  let orphansCleared = 0;
  for (const [dailyKey, buckets] of dailyByKey) {
    const rankingByWcStage = stageBucketsToRankingByWcStage(buckets);
    const hasAny = WC_RANKING_STAGES.some(
      (s) => rankingByWcStage[s].totalPosts > 0
    );
    if (!hasAny) continue;

    const dailyRef = db.doc(`user_stats_v2_daily/${dailyKey}`);
    const existing = await dailyRef.get();
    const existingData = existing.data() as Record<string, unknown> | undefined;
    const allPosts = safeNum(
      (existingData?.all as { posts?: unknown } | undefined)?.posts
    );

    if (allPosts <= 0) {
      console.log(
        `[skip daily] ${dailyKey}: all.posts=0 のため rankingByWcStage は書き込まない（幽霊doc防止）`
      );
      continue;
    }

    if (!DRY_RUN) {
      await dailyRef.set({ rankingByWcStage }, { merge: true });
    }
    dailyUpdated += 1;
  }

  const uidsToClean = targetUid ? [targetUid] : [...cumulativeByUid.keys()];
  for (const uid of uidsToClean) {
    const snap = await db
      .collection("user_stats_v2_daily")
      .where(admin.firestore.FieldPath.documentId(), ">=", `${uid}_`)
      .where(admin.firestore.FieldPath.documentId(), "<", `${uid}_\uf8ff`)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const allPosts = safeNum((data.all as { posts?: unknown } | undefined)?.posts);
      if (allPosts > 0 || !dailyWcStageHasPosts(data)) continue;

      console.log(`[orphan] ${doc.id}: all.posts=0 なのに rankingByWcStage あり → 削除`);
      if (!DRY_RUN) {
        const patch: Record<string, unknown> = {
          rankingByWcStage: admin.firestore.FieldValue.delete(),
        };
        for (const key of Object.keys(data)) {
          if (key.startsWith("rankingByWcStage.")) {
            patch[key] = admin.firestore.FieldValue.delete();
          }
        }
        await doc.ref.update(patch);
      }
      orphansCleared += 1;
    }
  }

  console.log(
    `\nDone. cumulative ${updated} user(s), daily ${dailyUpdated} doc(s), orphans cleared ${orphansCleared} ${
      DRY_RUN ? "would be " : ""
    }updated.`
  );
  if (!DRY_RUN && updated > 0) {
    console.log(
      "次: buildCumulativeRankingSnapshot を手動実行するか、15:55 cron を待ってください。"
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
