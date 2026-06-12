/**
 * 指定ユーザー・指定日（JST）の user_stats_v2_daily を確定投稿から作り直す。
 * 他の日付の daily は触らない。
 *
 * 使い方（プロジェクトルート、service-account.json 必須）:
 *   npx tsx scripts/rebuild-user-daily-stats-for-date.ts --dry-run \
 *     --uid=Rb3vF67NTLeCxSvrR15brCbiQSD2 --date=2026-06-12
 *
 *   --date 省略時は JST の今日
 */

import adminPkg from "firebase-admin";
import fs from "fs";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { resolveWcStageFromGame } from "../lib/wc/resolveWcStage";

const admin = adminPkg as typeof import("firebase-admin");

const DRY_RUN = process.argv.includes("--dry-run");
const uidArg = process.argv.find((a) => a.startsWith("--uid="));
const dateArg = process.argv.find((a) => a.startsWith("--date="));
const UID = uidArg?.slice("--uid=".length).trim() ?? "";
const DATE_KEY =
  dateArg?.slice("--date=".length).trim() ?? toDateKeyJST(new Date());

const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
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
  pointsSumV3: number;
  upsetPointsSum: number;
  upsetBonusSum: number;
  streakBonusSum: number;
  goalScorerHitCount: number;
  goalScorerBonusSum: number;
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
    pointsSumV3: 0,
    upsetPointsSum: 0,
    upsetBonusSum: 0,
    streakBonusSum: 0,
    goalScorerHitCount: 0,
    goalScorerBonusSum: 0,
  };
}

function toDateKeyJST(d: Date): string {
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

function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeLeague(raw: unknown): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v === "b1") return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "nba") return "nba";
  if (v === "pl" || v.includes("premier")) return "pl";
  if (v === "wc" || v === "fifa") return "wc";
  return null;
}

function normalizeSeasonPhase(
  v: unknown
): "play_in" | "playoffs" | null {
  if (v === "play_in" || v === "playoffs") return v;
  return null;
}

function normalizeSeasonRound(
  v: unknown
): "r1" | "r2" | "cf" | "finals" | null {
  if (v === "r1" || v === "r2" || v === "cf" || v === "finals") return v;
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

function teamIdFromSide(side: unknown): string | null {
  if (!side || typeof side !== "object") return null;
  const id = (side as { teamId?: unknown }).teamId;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function uniqueTeamIds(
  homeTeamId?: string | null,
  awayTeamId?: string | null
): string[] {
  return [...new Set([homeTeamId, awayTeamId].filter(Boolean))] as string[];
}

function addToBucket(b: RawBucket, stats: Record<string, unknown>, isWin: boolean) {
  b.posts += 1;
  b.wins += isWin ? 1 : 0;
  b.scoreErrorSum += safeNum(stats.scoreError);
  b.upsetOpportunityCount += stats.hadUpsetGame === true ? 1 : 0;
  b.upsetHitCount += stats.upsetHit === true ? 1 : 0;
  b.upsetPickCount += stats.hadUpsetGame === true ? 1 : 0;
  b.scorePrecisionSum += safeNum(stats.scorePrecision);
  b.pointsSumV3 += safeNum(stats.pointsV3);
  b.upsetPointsSum += safeNum(stats.upsetPoints);
  b.upsetBonusSum += safeNum(stats.upsetBonus);
  b.streakBonusSum += safeNum(stats.streakBonus);
  const gsb = safeNum(stats.goalScorerBonus);
  b.goalScorerHitCount += gsb > 0 ? 1 : 0;
  b.goalScorerBonusSum += gsb;
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

function ensureBucket(
  map: Record<string, RawBucket>,
  key: string
): RawBucket {
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
    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    if (!DRY_RUN) await batch.commit();
    removed += snap.size;
    if (snap.size < 450) break;
  }
  return removed;
}

(async () => {
  if (!UID) {
    console.error("必須: --uid=<UID>  [--date=YYYY-MM-DD]");
    process.exit(1);
  }

  console.log("=== rebuild user_stats_v2_daily for one JST date ===");
  console.log(`uid=${UID} date=${DATE_KEY}`);
  if (DRY_RUN) console.log(">>> DRY RUN\n");

  const postsSnap = await db
    .collection("posts")
    .where("authorUid", "==", UID)
    .where("status", "==", "final")
    .where("schemaVersion", "==", 2)
    .get();

  const gameIds = new Set<string>();
  for (const doc of postsSnap.docs) {
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

  const build = newDailyBuild();
  let matchedPosts = 0;

  for (const doc of postsSnap.docs) {
    const post = doc.data() as Record<string, unknown>;
    const stats = post.stats as Record<string, unknown> | undefined;
    if (!stats) continue;

    const gameId = String(post.gameId ?? "").trim();
    const game = gameId ? gameById.get(gameId) : undefined;
    const startAt = resolveStatsStartAt(post, game);
    if (!startAt) continue;

    const dateKey = toDateKeyJST(startAt.toDate());
    if (dateKey !== DATE_KEY) continue;

    matchedPosts++;
    const isWin = stats.isWin === true;
    const forRanking = stats.countedForRanking !== false;
    const leagueKey = normalizeLeague(post.league ?? game?.league);
    const phaseKey = normalizeSeasonPhase(post.seasonPhase ?? game?.seasonPhase);
    const roundKey = normalizeSeasonRound(post.seasonRound ?? game?.seasonRound);
    const wcStage =
      leagueKey === "wc"
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

    addToBucket(build.all, stats, isWin);

    if (forRanking) {
      addToBucket(build.ranking, stats, isWin);
      if (phaseKey) addToBucket(ensureBucket(build.rankingByPhase, phaseKey), stats, isWin);
      if (forRanking && phaseKey === "playoffs" && roundKey) {
        addToBucket(
          ensureBucket(build.rankingByPlayoffRound, roundKey),
          stats,
          isWin
        );
      }
      if (leagueKey === "wc") {
        addToBucket(build.rankingByWcStage.overall, stats, isWin);
        if (wcStage === "qualifying") {
          addToBucket(build.rankingByWcStage.qualifying, stats, isWin);
        } else if (wcStage === "main") {
          addToBucket(build.rankingByWcStage.main, stats, isWin);
        }
      }
      for (const teamId of uniqueTeamIds(homeTeamId, awayTeamId)) {
        addToBucket(ensureBucket(build.teams, teamId), stats, isWin);
      }
    }

    if (leagueKey) {
      addToBucket(ensureBucket(build.leagues, leagueKey), stats, isWin);
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

  console.log(`matched final posts on ${DATE_KEY}: ${matchedPosts}`);
  if (matchedPosts === 0) {
    console.log("この日の確定投稿がないため終了します。");
    process.exit(0);
  }

  console.log(
    `all: posts=${build.all.posts} wins=${build.all.wins} points=${build.all.pointsSumV3}`
  );
  if (build.leagues.wc) {
    console.log(
      `leagues.wc: posts=${build.leagues.wc.posts} points=${build.leagues.wc.pointsSumV3}`
    );
    console.log(
      `rankingByWcStage: overall=${build.rankingByWcStage.overall.posts} qualifying=${build.rankingByWcStage.qualifying.posts} main=${build.rankingByWcStage.main.posts}`
    );
  }

  const dailyRef = db.doc(`user_stats_v2_daily/${UID}_${DATE_KEY}`);

  if (DRY_RUN) {
    console.log("\n[dry-run] would replace daily doc and applied_posts markers");
    process.exit(0);
  }

  const markersRemoved = await deleteAppliedPosts(dailyRef);
  console.log(`removed ${markersRemoved} old applied_posts marker(s)`);

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
    const markerRef = dailyRef.collection("applied_posts").doc(m.postId);
    markerBatch.set(markerRef, {
      at: FieldValue.serverTimestamp(),
      league: m.league,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      posts: 1,
      wins: m.isWin ? 1 : 0,
      scoreErrorSum: safeNum(m.stats.scoreError),
      scorePrecisionSum: safeNum(m.stats.scorePrecision),
      pointsSumV3: safeNum(m.stats.pointsV3),
      upsetPointsSum: safeNum(m.stats.upsetPoints),
      upsetHitCount: m.stats.upsetHit === true ? 1 : 0,
      upsetOpportunityCount: m.stats.hadUpsetGame === true ? 1 : 0,
      countedForRanking: m.forRanking,
      source: "rebuild-user-daily-stats-for-date",
    });
    ops++;
    if (ops >= 400) {
      await markerBatch.commit();
      markerBatch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await markerBatch.commit();

  console.log(`✓ wrote user_stats_v2_daily/${UID}_${DATE_KEY}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
