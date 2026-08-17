/**
 * 指定 JST 日の daily を投稿から作り直し、cumulative_stats を再構築してスナップショットを生成。
 *
 * 1. 対象日の user_stats_v2_daily を確定投稿から全ユーザー分 rebuild
 * 2. WC rankingByWcStage を投稿ベースで再計算（backfill-wc-cumulative-from-daily と同じ）
 * 3. cumulative のプロフィール / ranking / phase / round を全 daily 合算で上書き
 * 4. buildCumulativeRankingSnapshot
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   cd functions && npm run build && cd ..
 *   npx tsx scripts/rebuild-cumulative-ranking-today.ts --dry-run
 *   npx tsx scripts/rebuild-cumulative-ranking-today.ts --date=2026-06-14
 *   npx tsx scripts/rebuild-cumulative-ranking-today.ts --skip-snapshot
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { createRequire } from "module";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { type WcRankingStageBucket } from "../lib/rankings/dailyWcStageBuckets";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";

const admin = adminPkg as typeof import("firebase-admin");
const require = createRequire(import.meta.url);

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_SNAPSHOT = process.argv.includes("--skip-snapshot");
const dateArg = process.argv.find((a) => a.startsWith("--date="));

function toDateKeyJST(d: Date): string {
  const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${j.getUTCFullYear()}-${String(j.getUTCMonth() + 1).padStart(2, "0")}-${String(j.getUTCDate()).padStart(2, "0")}`;
}

const DATE_KEY = dateArg?.slice("--date=".length).trim() ?? toDateKeyJST(new Date());

if (!fs.existsSync("service-account.json")) {
  console.error("service-account.json が見つかりません");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync("service-account.json", "utf8"))
  ),
});

const db = admin.firestore();

type RawBucket = {
  posts: number;
  wins: number;
  scoreErrorSum: number;
  upsetHitCount: number;
  upsetOpportunityCount: number;
  upsetPickCount: number;
  scorePrecisionSum: number;
  exactHitCount: number;
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

function emptyBucket(): RawBucket {
  return {
    posts: 0,
    wins: 0,
    scoreErrorSum: 0,
    upsetHitCount: 0,
    upsetOpportunityCount: 0,
    upsetPickCount: 0,
    scorePrecisionSum: 0,
    exactHitCount: 0,
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

function toTimestamp(v: unknown): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") {
    return v as Timestamp;
  }
  return null;
}

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

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v === "b1") return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "nba") return "nba";
  if (v === "pl") return "pl";
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

function normalizeSeasonPhase(v: unknown): "play_in" | "playoffs" | null {
  if (v === "play_in" || v === "playoffs") return v;
  return null;
}

function normalizeSeasonRound(
  v: unknown
): "r1" | "r2" | "cf" | "finals" | null {
  if (v === "r1" || v === "r2" || v === "cf" || v === "finals") return v;
  return null;
}

function teamIdFromSide(side: unknown): string | null {
  if (!side || typeof side !== "object") return null;
  const id = (side as { teamId?: unknown }).teamId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function uniqueTeamIds(home?: string | null, away?: string | null): string[] {
  return [...new Set([home, away].filter(Boolean))] as string[];
}

function addToBucket(
  b: RawBucket,
  stats: Record<string, unknown>,
  isWin: boolean,
  isWc: boolean
) {
  b.posts += 1;
  b.wins += isWin ? 1 : 0;
  b.scoreErrorSum += safeNum(stats.scoreError);
  b.upsetOpportunityCount += stats.hadUpsetGame === true ? 1 : 0;
  b.upsetHitCount += stats.upsetHit === true ? 1 : 0;
  b.upsetPickCount += stats.hadUpsetGame === true ? 1 : 0;
  b.scorePrecisionSum += isWc ? 0 : safeNum(stats.scorePrecision);
  b.exactHitCount += isWc && stats.exactMatch === true ? 1 : 0;
  b.pointsSumV3 += safeNum(stats.pointsV3);
  b.upsetPointsSum += safeNum(stats.upsetPoints);
  b.upsetBonusSum += safeNum(stats.upsetBonus);
  b.streakBonusSum += safeNum(stats.streakBonus);
  const gsb = safeNum(stats.goalScorerBonus);
  b.goalScorerHitCount += gsb > 0 ? 1 : 0;
  b.goalScorerBonusSum += gsb;
}

function addRawBuckets(base: RawBucket, inc: RawBucket): RawBucket {
  return {
    posts: base.posts + inc.posts,
    wins: base.wins + inc.wins,
    scoreErrorSum: base.scoreErrorSum + inc.scoreErrorSum,
    upsetHitCount: base.upsetHitCount + inc.upsetHitCount,
    upsetOpportunityCount: base.upsetOpportunityCount + inc.upsetOpportunityCount,
    upsetPickCount: base.upsetPickCount + inc.upsetPickCount,
    scorePrecisionSum: base.scorePrecisionSum + inc.scorePrecisionSum,
    exactHitCount: base.exactHitCount + inc.exactHitCount,
    pointsSumV3: base.pointsSumV3 + inc.pointsSumV3,
    upsetPointsSum: base.upsetPointsSum + inc.upsetPointsSum,
    upsetBonusSum: base.upsetBonusSum + inc.upsetBonusSum,
    streakBonusSum: base.streakBonusSum + inc.streakBonusSum,
    goalScorerHitCount: base.goalScorerHitCount + inc.goalScorerHitCount,
    goalScorerBonusSum: base.goalScorerBonusSum + inc.goalScorerBonusSum,
  };
}

function bucketFromDailyField(src: Record<string, unknown> | undefined): RawBucket {
  if (!src) return emptyBucket();
  return {
    posts: safeNum(src.posts),
    wins: safeNum(src.wins),
    scoreErrorSum: safeNum(src.scoreErrorSum),
    upsetHitCount: safeNum(src.upsetHitCount),
    upsetOpportunityCount: safeNum(src.upsetOpportunityCount),
    upsetPickCount: safeNum(src.upsetPickCount),
    scorePrecisionSum: safeNum(src.scorePrecisionSum),
    exactHitCount: safeNum(src.exactHitCount),
    pointsSumV3: safeNum(src.pointsSumV3),
    upsetPointsSum: safeNum(src.upsetPointsSum),
    upsetBonusSum: safeNum(src.upsetBonusSum),
    streakBonusSum: safeNum(src.streakBonusSum),
    goalScorerHitCount: safeNum(src.goalScorerHitCount),
    goalScorerBonusSum: safeNum(src.goalScorerBonusSum),
  };
}

function bucketToRankingTotals(b: RawBucket): RankingTotals {
  return {
    totalPosts: b.posts,
    totalWins: b.wins,
    totalPoints: b.pointsSumV3,
    totalUpset: b.upsetPointsSum,
    totalPrecision: b.exactHitCount,
    totalGoalScorerHits: b.goalScorerHitCount,
    winRate: b.posts > 0 ? b.wins / b.posts : 0,
  };
}

function bucketFromPostStats(stats: Record<string, unknown>): RawBucket {
  const goalScorerBonus = safeNum(stats.goalScorerBonus);
  return {
    posts: 1,
    wins: stats.isWin === true ? 1 : 0,
    scoreErrorSum: safeNum(stats.scoreError),
    upsetOpportunityCount: stats.hadUpsetGame === true ? 1 : 0,
    upsetHitCount: stats.upsetHit === true ? 1 : 0,
    upsetPickCount: stats.hadUpsetGame === true ? 1 : 0,
    scorePrecisionSum: 0,
    exactHitCount: stats.exactMatch === true ? 1 : 0,
    pointsSumV3: safeNum(stats.pointsV3),
    upsetPointsSum: safeNum(stats.upsetPoints),
    upsetBonusSum: safeNum(stats.upsetBonus),
    streakBonusSum: safeNum(stats.streakBonus),
    goalScorerHitCount: goalScorerBonus > 0 ? 1 : 0,
    goalScorerBonusSum: goalScorerBonus,
  };
}

function emptyStageBuckets(): Record<WcRankingStageBucket, RawBucket> {
  return {
    overall: emptyBucket(),
    qualifying: emptyBucket(),
    main: emptyBucket(),
  };
}

function applyPostToStageBuckets(
  buckets: Record<WcRankingStageBucket, RawBucket>,
  inc: RawBucket,
  stage: ReturnType<typeof resolveWcStageFromGame>
) {
  buckets.overall = addRawBuckets(buckets.overall, inc);
  if (stage === "qualifying") {
    buckets.qualifying = addRawBuckets(buckets.qualifying, inc);
  } else if (stage === "main") {
    buckets.main = addRawBuckets(buckets.main, inc);
  }
}

function stageBucketsToRankingByWcStage(
  buckets: Record<WcRankingStageBucket, RawBucket>
): Record<WcRankingStageBucket, RankingTotals> {
  return {
    overall: bucketToRankingTotals(buckets.overall),
    qualifying: bucketToRankingTotals(buckets.qualifying),
    main: bucketToRankingTotals(buckets.main),
  };
}

type DailyBuild = {
  all: RawBucket;
  ranking: RawBucket;
  rankingByPhase: Record<string, RawBucket>;
  rankingByPlayoffRound: Record<string, RawBucket>;
  rankingByWcStage: Record<string, RawBucket>;
  leagues: Record<string, RawBucket>;
  teams: Record<string, RawBucket>;
  markers: Array<{
    postId: string;
    league: string | null;
    homeTeamId: string | null;
    awayTeamId: string | null;
    stats: Record<string, unknown>;
    isWin: boolean;
    forRanking: boolean;
  }>;
};

function newDailyBuild(): DailyBuild {
  return {
    all: emptyBucket(),
    ranking: emptyBucket(),
    rankingByPhase: {},
    rankingByPlayoffRound: {},
    rankingByWcStage: {
      overall: emptyBucket(),
      qualifying: emptyBucket(),
      main: emptyBucket(),
    },
    leagues: {},
    teams: {},
    markers: [],
  };
}

function ensureBucket(map: Record<string, RawBucket>, key: string): RawBucket {
  if (!map[key]) map[key] = emptyBucket();
  return map[key];
}

async function deleteAppliedPosts(
  parentRef: FirebaseFirestore.DocumentReference
): Promise<number> {
  let removed = 0;
  for (;;) {
    const snap = await parentRef.collection("applied_posts").limit(450).get();
    if (snap.empty) break;
    if (!DRY_RUN) {
      const batch = db.batch();
      for (const d of snap.docs) batch.delete(d.ref);
      await batch.commit();
    }
    removed += snap.size;
    if (snap.size < 450) break;
  }
  return removed;
}

async function loadAllFinalPosts() {
  const posts: QueryDocumentSnapshot[] = [];
  let last: QueryDocumentSnapshot | undefined;
  while (true) {
    let q = db
      .collection("posts")
      .where("schemaVersion", "==", 2)
      .where("status", "==", "final")
      .orderBy(FieldPath.documentId())
      .limit(500);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    posts.push(...snap.docs);
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < 500) break;
  }
  return posts;
}

async function rebuildDailyForDate(allPosts: QueryDocumentSnapshot[]) {
  const gameIds = new Set<string>();
  for (const doc of allPosts) {
    const gameId = String(doc.data().gameId ?? "").trim();
    if (gameId) gameIds.add(gameId);
  }

  const gameById = new Map<string, Record<string, unknown>>();
  const gameIdList = [...gameIds];
  for (let i = 0; i < gameIdList.length; i += 300) {
    const chunk = gameIdList.slice(i, i + 300);
    const snaps = await db.getAll(...chunk.map((id) => db.doc(`games/${id}`)));
    for (const snap of snaps) {
      if (snap.exists) gameById.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }

  const builds = new Map<string, DailyBuild>();
  let matchedPosts = 0;

  for (const doc of allPosts) {
    const post = doc.data() as Record<string, unknown>;
    const stats = post.stats as Record<string, unknown> | undefined;
    if (!stats) continue;

    const uid = String(post.authorUid ?? "").trim();
    if (!uid) continue;

    const gameId = String(post.gameId ?? "").trim();
    const game = gameId ? gameById.get(gameId) : undefined;
    const startAt = resolveStatsStartAt(post, game);
    if (!startAt) continue;

    if (toDateKeyJST(startAt.toDate()) !== DATE_KEY) continue;

    matchedPosts++;
    if (!builds.has(uid)) builds.set(uid, newDailyBuild());
    const build = builds.get(uid)!;

    const isWin = stats.isWin === true;
    const forRanking = stats.countedForRanking !== false;
    const leagueKey = normalizeLeague(post.league ?? game?.league);
    const isWc = leagueKey === "wc";
    const phaseKey = normalizeSeasonPhase(post.seasonPhase ?? game?.seasonPhase);
    const roundKey = normalizeSeasonRound(post.seasonRound ?? game?.seasonRound);
    const wcStage =
      isWc
        ? resolveWcStageFromGame({
            knockout: game?.knockout === true,
            roundLabel:
              typeof game?.roundLabel === "string" ? game.roundLabel : null,
            wcStage: typeof game?.wcStage === "string" ? game.wcStage : null,
          })
        : null;

    const homeTeamId =
      teamIdFromSide(post.home) ??
      (typeof game?.homeTeamId === "string" ? game.homeTeamId : null);
    const awayTeamId =
      teamIdFromSide(post.away) ??
      (typeof game?.awayTeamId === "string" ? game.awayTeamId : null);

    addToBucket(build.all, stats, isWin, isWc);

    if (forRanking) {
      addToBucket(build.ranking, stats, isWin, isWc);
      if (phaseKey) {
        addToBucket(ensureBucket(build.rankingByPhase, phaseKey), stats, isWin, isWc);
      }
      if (phaseKey === "playoffs" && roundKey) {
        addToBucket(
          ensureBucket(build.rankingByPlayoffRound, roundKey),
          stats,
          isWin,
          isWc
        );
      }
      if (isWc) {
        addToBucket(build.rankingByWcStage.overall, stats, isWin, isWc);
        if (wcStage === "qualifying") {
          addToBucket(build.rankingByWcStage.qualifying, stats, isWin, isWc);
        } else if (wcStage === "main") {
          addToBucket(build.rankingByWcStage.main, stats, isWin, isWc);
        }
      }
      for (const teamId of uniqueTeamIds(homeTeamId, awayTeamId)) {
        addToBucket(ensureBucket(build.teams, teamId), stats, isWin, isWc);
      }
    }

    if (leagueKey) {
      addToBucket(ensureBucket(build.leagues, leagueKey), stats, isWin, isWc);
    }

    build.markers.push({
      postId: doc.id,
      league: leagueKey,
      homeTeamId,
      awayTeamId,
      stats,
      isWin,
      forRanking,
    });
  }

  console.log(`[daily] matched posts on ${DATE_KEY}: ${matchedPosts}, users: ${builds.size}`);

  let rebuilt = 0;
  for (const [uid, build] of builds) {
    const dailyRef = db.doc(`user_stats_v2_daily/${uid}_${DATE_KEY}`);
    if (!DRY_RUN) {
      await deleteAppliedPosts(dailyRef);
      const dailyDoc: Record<string, unknown> = {
        date: DATE_KEY,
        updatedAt: FieldValue.serverTimestamp(),
        all: build.all,
        ranking: build.ranking,
        leagues: build.leagues,
        teams: build.teams,
        rankingByPhase: build.rankingByPhase,
        rankingByPlayoffRound: build.rankingByPlayoffRound,
        rankingByWcStage: {
          overall: build.rankingByWcStage.overall,
          ...(build.rankingByWcStage.qualifying.posts > 0
            ? { qualifying: build.rankingByWcStage.qualifying }
            : {}),
          ...(build.rankingByWcStage.main.posts > 0
            ? { main: build.rankingByWcStage.main }
            : {}),
        },
        dailyRebuiltAt: FieldValue.serverTimestamp(),
      };
      await dailyRef.set(dailyDoc);

      let markerBatch = db.batch();
      let ops = 0;
      for (const m of build.markers) {
        markerBatch.set(dailyRef.collection("applied_posts").doc(m.postId), {
          at: FieldValue.serverTimestamp(),
          league: m.league,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          posts: 1,
          wins: m.isWin ? 1 : 0,
          scoreErrorSum: safeNum(m.stats.scoreError),
          scorePrecisionSum: safeNum(m.stats.scorePrecision),
          exactHitCount: m.stats.exactMatch === true ? 1 : 0,
          pointsSumV3: safeNum(m.stats.pointsV3),
          upsetPointsSum: safeNum(m.stats.upsetPoints),
          upsetHitCount: m.stats.upsetHit === true ? 1 : 0,
          upsetOpportunityCount: m.stats.hadUpsetGame === true ? 1 : 0,
          countedForRanking: m.forRanking,
          source: "rebuild-cumulative-ranking-today",
        });
        ops++;
        if (ops >= 400) {
          await markerBatch.commit();
          markerBatch = db.batch();
          ops = 0;
        }
      }
      if (ops > 0) await markerBatch.commit();
    }
    rebuilt++;
  }

  console.log(`[daily] rebuilt ${rebuilt} doc(s)`);
  return { gameById, matchedPosts };
}

async function rebuildWcCumulativeFromPosts(
  allPosts: QueryDocumentSnapshot[],
  gameById: Map<string, Record<string, unknown>>
) {
  const cumulativeByUid = new Map<string, Record<WcRankingStageBucket, RawBucket>>();
  let counted = 0;

  for (const doc of allPosts) {
    const p = doc.data() as Record<string, unknown>;
    if (normalizeLeague(p.league) !== "wc") continue;
    const stats = p.stats as Record<string, unknown> | undefined;
    if (!stats || stats.countedForRanking === false) continue;

    const uid = String(p.authorUid ?? "").trim();
    if (!uid) continue;

    const gameId = String(p.gameId ?? "").trim();
    const game = gameId ? gameById.get(gameId) : undefined;
    const stage = resolveWcStageFromGame({
      knockout: game?.knockout === true,
      roundLabel:
        typeof game?.roundLabel === "string" ? game.roundLabel : null,
      wcStage: typeof game?.wcStage === "string" ? game.wcStage : null,
    });

    if (!cumulativeByUid.has(uid)) {
      cumulativeByUid.set(uid, emptyStageBuckets());
    }
    applyPostToStageBuckets(
      cumulativeByUid.get(uid)!,
      bucketFromPostStats(stats),
      stage
    );
    counted++;
  }

  console.log(`[wc cumulative] wc posts=${counted}, users=${cumulativeByUid.size}`);

  let updated = 0;
  for (const [uid, buckets] of cumulativeByUid) {
    const rankingByWcStage = stageBucketsToRankingByWcStage(buckets);
    if (!DRY_RUN) {
      await db.doc(`cumulative_stats/${uid}`).set(
        {
          rankingByWcStage,
          wcRankingRebuiltAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    updated++;
  }
  console.log(`[wc cumulative] updated ${updated} user(s)`);
  return cumulativeByUid;
}

async function rebuildCumulativeFromAllDaily() {
  const dailySnap = await db.collection("user_stats_v2_daily").get();
  const byUid = new Map<
    string,
    {
      all: RawBucket;
      ranking: RawBucket;
      playIn: RawBucket;
      playoffs: RawBucket;
      rounds: Record<string, RawBucket>;
    }
  >();

  for (const doc of dailySnap.docs) {
    const uid = doc.id.split("_")[0];
    if (!uid) continue;
    const data = doc.data() as Record<string, unknown>;

    if (!byUid.has(uid)) {
      byUid.set(uid, {
        all: emptyBucket(),
        ranking: emptyBucket(),
        playIn: emptyBucket(),
        playoffs: emptyBucket(),
        rounds: {},
      });
    }
    const agg = byUid.get(uid)!;
    agg.all = addRawBuckets(agg.all, bucketFromDailyField(data.all as Record<string, unknown>));
    agg.ranking = addRawBuckets(
      agg.ranking,
      bucketFromDailyField(
        (data.ranking as Record<string, unknown> | undefined) ??
          (data.all as Record<string, unknown> | undefined)
      )
    );

    const byPhase = (data.rankingByPhase ?? {}) as Record<string, Record<string, unknown>>;
    if (byPhase.play_in) {
      agg.playIn = addRawBuckets(agg.playIn, bucketFromDailyField(byPhase.play_in));
    }
    if (byPhase.playoffs) {
      agg.playoffs = addRawBuckets(agg.playoffs, bucketFromDailyField(byPhase.playoffs));
    }

    const byRound = (data.rankingByPlayoffRound ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [rk, bucket] of Object.entries(byRound)) {
      agg.rounds[rk] = addRawBuckets(
        agg.rounds[rk] ?? emptyBucket(),
        bucketFromDailyField(bucket)
      );
    }
  }

  console.log(`[cumulative] recompute from daily for ${byUid.size} user(s)`);

  let updated = 0;
  for (const [uid, agg] of byUid) {
    const rankingByPlayoffRound: Record<string, RankingTotals> = {};
    for (const [rk, bucket] of Object.entries(agg.rounds)) {
      rankingByPlayoffRound[rk] = bucketToRankingTotals(bucket);
    }

    const patch: Record<string, unknown> = {
      uid,
      totalPosts: agg.all.posts,
      totalWins: agg.all.wins,
      totalPoints: agg.all.pointsSumV3,
      totalUpset: agg.all.upsetPointsSum,
      totalPrecision: agg.all.scorePrecisionSum,
      winRate: agg.all.posts > 0 ? agg.all.wins / agg.all.posts : 0,
      ranking: {
        totalPosts: agg.ranking.posts,
        totalWins: agg.ranking.wins,
        totalPoints: agg.ranking.pointsSumV3,
        totalUpset: agg.ranking.upsetPointsSum,
        totalPrecision: agg.ranking.scorePrecisionSum,
        winRate: agg.ranking.posts > 0 ? agg.ranking.wins / agg.ranking.posts : 0,
      },
      rankingByPhase: {
        play_in: bucketToRankingTotals(agg.playIn),
        playoffs: bucketToRankingTotals(agg.playoffs),
      },
      rankingByPlayoffRound,
      lastAggregatedDate: DATE_KEY,
      cumulativeRebuiltAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!DRY_RUN) {
      await db.doc(`cumulative_stats/${uid}`).set(patch, { merge: true });
    }
    updated++;
  }

  console.log(`[cumulative] updated ${updated} user(s)`);
}

(async () => {
  console.log("=== rebuild cumulative ranking for JST date ===");
  console.log(`date=${DATE_KEY}`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const allPosts = await loadAllFinalPosts();
  console.log(`loaded final posts: ${allPosts.length}`);

  const { gameById } = await rebuildDailyForDate(allPosts);
  const wcMap = await rebuildWcCumulativeFromPosts(allPosts, gameById);
  await rebuildCumulativeFromAllDaily();

  if (SKIP_SNAPSHOT || DRY_RUN) {
    console.log("\nDone (snapshot skipped).");
    process.exit(0);
  }

  const adminFunctions = require("../functions/node_modules/firebase-admin") as typeof import("firebase-admin");
  if (adminFunctions.apps.length === 0) {
    adminFunctions.initializeApp({
      credential: adminFunctions.credential.cert(
        JSON.parse(fs.readFileSync("service-account.json", "utf8"))
      ),
    });
  }

  const { buildCumulativeRankingSnapshot } = require(
    "../functions/lib/rankings/buildCumulativeRankingSnapshot.js"
  ) as {
    buildCumulativeRankingSnapshot: () => Promise<{
      ok: boolean;
      ranksWritten: number;
      historyDateKey: string;
    }>;
  };

  console.log("\n=== buildCumulativeRankingSnapshot ===");
  const result = await buildCumulativeRankingSnapshot();
  console.log("snapshot result:", result);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
