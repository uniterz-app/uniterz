/** 指定日（ユーザー TZ の暦日）に始まった NBA 試合の確定 posts を読み、UNITERZ スコア Top20 を作る */
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { shiftDateKeyInTimeZone } from "@/lib/games/gamesWindowRange";
import { parseDateKeyInTimeZone } from "@/lib/time/zonedTime";
import { mergeUserPlansIntoLeaderboardRows } from "@/lib/rankings/mergeUserPlanIntoRankingPayload";
import {
  DAILY_SCORE_TOP_N,
  aggregateDailyScores,
  withRanks,
  type DailyScoreLeadersPayload,
  type DailyScorePostInput,
} from "@/lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";

/** functions/src/writeGameUserPoints.ts と同じビット */
const GAME_USER_POINTS_RANKING = 1;
const GAME_USER_POINTS_PICKUP = 2;

/** PRO LEAGUE は Pro 以外を外すので、上位から多めに取ってから絞る */
const OPEN_CANDIDATES = DAILY_SCORE_TOP_N * 3;

/** onGameFinalV2 が posts を確定し終えた試合（final フラグだけだと settle 前がある） */
function isSettledGame(data: Record<string, unknown>): boolean {
  return data.resultComputedAtV2 != null;
}

/** TODAY はプレシーズンも出す（通常ランキング対象外の試合を PICK UP / PRO LEAGUE 両方に数える） */
function isPreseasonGame(data: Record<string, unknown>): boolean {
  return String(data.seasonPhase ?? "") === "preseason";
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export async function loadDailyScoreLeadersAdmin(
  db: Firestore,
  params: { dateKey: string; timeZone: string }
): Promise<DailyScoreLeadersPayload> {
  const { dateKey, timeZone } = params;
  const start = parseDateKeyInTimeZone(dateKey, timeZone);
  const nextKey = shiftDateKeyInTimeZone(dateKey, timeZone, 1);
  const end = nextKey ? parseDateKeyInTimeZone(nextKey, timeZone) : null;
  if (!start || !end) throw new Error("invalid_date");

  const gamesSnap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", GAME_SCHEDULE_SEASON)
    .where("startAtJst", ">=", Timestamp.fromDate(start))
    .where("startAtJst", "<", Timestamp.fromDate(end))
    .orderBy("startAtJst", "asc")
    .limit(40)
    .get();

  const games = gamesSnap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter((g) => g.data.postponed !== true);
  const finals = games.filter((g) => isSettledGame(g.data));

  const posts: DailyScorePostInput[] = [];

  // 試合ごとの小計（onGameFinalV2 が書く）。無い試合だけ posts を読む
  const subtotalSnaps = finals.length
    ? await db.getAll(...finals.map((g) => db.doc(`gameUserPoints/${g.id}`)))
    : [];
  const missing: string[] = [];
  subtotalSnaps.forEach((snap, i) => {
    const entries = snap.exists ? (snap.data()?.entries as unknown) : null;
    if (!Array.isArray(entries)) {
      missing.push(finals[i]!.id);
      return;
    }
    const preseason = isPreseasonGame(finals[i]!.data);
    for (const e of entries as Array<{ u?: unknown; p?: unknown; k?: unknown }>) {
      const k = Number(e.k) || 0;
      posts.push({
        uid: String(e.u ?? ""),
        points: Number(e.p),
        countedForRanking: preseason || (k & GAME_USER_POINTS_RANKING) !== 0,
        countedForPickup: preseason || (k & GAME_USER_POINTS_PICKUP) !== 0,
      });
    }
  });

  const preseasonIds = new Set(
    finals.filter((g) => isPreseasonGame(g.data)).map((g) => g.id)
  );
  const postSnaps = await Promise.all(
    missing.map((gameId) =>
      db
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get()
    )
  );
  postSnaps.forEach((snap, si) => {
    const preseason = preseasonIds.has(missing[si]!);
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      if (d.status !== "final") continue;
      const stats = (d.stats ?? {}) as Record<string, unknown>;
      const points = Number(stats.pointsV3);
      if (!Number.isFinite(points)) continue;
      const countedForRanking = preseason || stats.countedForRanking === true;
      posts.push({
        uid: String(d.authorUid ?? ""),
        points,
        // レガシー: countedForPickup 未設定の投稿は当時 ranking 全試合が PICK UP 加算
        countedForPickup:
          preseason ||
          (typeof stats.countedForPickup === "boolean"
            ? stats.countedForPickup
            : countedForRanking),
        countedForRanking,
        displayName: str(d.authorDisplayName),
        handle: str(d.authorHandle),
        photoURL: str(d.authorPhotoURL) ?? null,
      });
    }
  });

  const standard = await mergeUserPlansIntoLeaderboardRows(
    aggregateDailyScores(posts, "standard").slice(0, DAILY_SCORE_TOP_N)
  );
  const openCandidates = await mergeUserPlansIntoLeaderboardRows(
    aggregateDailyScores(posts, "open").slice(0, OPEN_CANDIDATES)
  );
  const open = withRanks(
    openCandidates.filter((r) => r.plan === "pro")
  ).slice(0, DAILY_SCORE_TOP_N);

  return {
    ok: true,
    dateKey,
    timeZone,
    gameCount: games.length,
    finalCount: finals.length,
    complete: games.length > 0 && finals.length === games.length,
    firstStartAtMs: games.reduce<number | null>((min, g) => {
      const ts = g.data.startAtJst as { toMillis?: () => number } | undefined;
      const ms = typeof ts?.toMillis === "function" ? ts.toMillis() : NaN;
      if (!Number.isFinite(ms)) return min;
      return min == null || ms < min ? ms : min;
    }, null),
    preseason:
      games.length > 0 &&
      games.every((g) => isPreseasonGame(g.data)),
    boards: { standard, open },
  };
}
