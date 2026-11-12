/** TODAY UNITERZ のサーバーキャッシュ（`/api/uniterz/daily-leaders` と `/me` で共有） */
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  loadDailyScoreLeadersAdmin,
  rankDailyScoreCandidates,
  selectDailyScoreBoardRows,
} from "@/lib/rankings/dailyScoreLeaders/loadDailyScoreLeadersAdmin";
import type {
  DailyScoreDivision,
  DailyScoreLeaderRow,
  DailyScoreLeadersPayload,
} from "@/lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { resolveLatestNbaSlateDateKey } from "@/lib/games/latestNbaSlate";
import { loadGameDayIndex } from "@/lib/games/server/gameDayIndexAdmin";
import { TIMEZONE_ET } from "@/lib/time/zonedTime";
import { DAILY_SCORE_LEADERS_PLANS_TAG } from "@/lib/rankings/dailyScoreLeaders/dailyScoreLeadersCacheTags";

class DayNotCompleteError extends Error {
  constructor(readonly payload: DailyScoreLeadersPayload) {
    super("day_not_complete");
  }
}

/** 試合中の日: onGameFinalV2 → /api/internal/revalidate/daily-score-leaders で破棄。時間失効は取りこぼし用の保険 */
function loadLiveCached(dateKey: string, timeZone: string) {
  return unstable_cache(
    () => loadDailyScoreLeadersAdmin(getAdminDb(), { dateKey, timeZone }),
    ["uniterz-daily-score-leaders", "v6", dateKey, timeZone],
    { revalidate: 1800, tags: ["uniterz-daily-score-leaders"] }
  )();
}

/**
 * 全試合 settle 済みの日は結果が変わらないので無期限キャッシュ（以後 Firestore を読まない）。
 * 未完了の日は throw してキャッシュさせず、上のライブキャッシュを返す。
 */
async function loadCached(dateKey: string, timeZone: string): Promise<DailyScoreLeadersPayload> {
  try {
    return await unstable_cache(
      async () => {
        const payload = await loadLiveCached(dateKey, timeZone);
        if (!payload.complete) throw new DayNotCompleteError(payload);
        return payload;
      },
      ["uniterz-daily-score-leaders-complete", "v6", dateKey, timeZone],
      { revalidate: false }
    )();
  } catch (e) {
    if (e instanceof DayNotCompleteError) return e.payload;
    throw e;
  }
}

function candidatesKey(candidates: DailyScoreLeaderRow[]): string {
  return createHash("sha1")
    .update(candidates.map((r) => `${r.uid}:${r.points}`).join(","))
    .digest("hex");
}

/** 確定日の無期限キャッシュ後に Pro 化・解約・スキン変更した人も反映するため、plan 依存部分だけ短い間隔で作り直す */
export function selectDailyScoreBoardRowsCached(
  candidates: DailyScoreLeaderRow[],
  dateKey: string,
  division: DailyScoreDivision
) {
  return unstable_cache(
    () => selectDailyScoreBoardRows(candidates, division, getAdminDb()),
    ["uniterz-daily-score-leaders-plans", "v6", dateKey, division, candidatesKey(candidates)],
    { revalidate: 300, tags: [DAILY_SCORE_LEADERS_PLANS_TAG] }
  )();
}

/** 全員の順位（自分の順位用）。PRO LEAGUE は Pro の入れ替わりがあるので一覧と同じ間隔で作り直す */
export function rankDailyScoreCandidatesCached(
  candidates: DailyScoreLeaderRow[],
  dateKey: string,
  division: DailyScoreDivision
) {
  return unstable_cache(
    () => rankDailyScoreCandidates(candidates, division, getAdminDb()),
    ["uniterz-daily-score-ranks", "v1", dateKey, division, candidatesKey(candidates)],
    { revalidate: 300, tags: [DAILY_SCORE_LEADERS_PLANS_TAG] }
  )();
}

function loadNbaGameDayIndexCached() {
  return unstable_cache(
    async () => loadGameDayIndex(getAdminDb(), { league: "nba", season: GAME_SCHEDULE_SEASON }),
    ["game-day-index", "nba", GAME_SCHEDULE_SEASON],
    {
      revalidate: 3600,
      tags: ["game-day-index", `game-day-index:nba:${GAME_SCHEDULE_SEASON}`],
    }
  )();
}

/**
 * 開始済みで最新の試合日（米国東部の暦日・Result Drop / TODAY スタッツと同じ基準）。全ユーザー同じ。
 * 次の試合日の最初の試合が始まるまで、試合の無い日も前の試合日を出し続ける。
 */
export async function loadLatestDailyScoreSlate(): Promise<DailyScoreLeadersPayload> {
  const index = await loadNbaGameDayIndexCached();
  const slateKey = resolveLatestNbaSlateDateKey(index.startMs);
  return loadCached(slateKey, TIMEZONE_ET);
}
