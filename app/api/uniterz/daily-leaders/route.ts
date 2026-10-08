import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
import { loadDailyScoreLeadersAdmin } from "@/lib/rankings/dailyScoreLeaders/loadDailyScoreLeadersAdmin";
import type {
  DailyScoreDivision,
  DailyScoreLeadersPayload,
} from "@/lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { resolveLatestNbaSlateDateKey } from "@/lib/games/latestNbaSlate";
import { loadGameDayIndex } from "@/lib/games/server/gameDayIndexAdmin";
import { TIMEZONE_ET } from "@/lib/time/zonedTime";

export const runtime = "nodejs";

async function optionalUid(req: Request): Promise<string | null> {
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

class DayNotCompleteError extends Error {
  constructor(readonly payload: DailyScoreLeadersPayload) {
    super("day_not_complete");
  }
}

/** 試合中の日: onGameFinalV2 → /api/internal/revalidate/daily-score-leaders で破棄。時間失効は取りこぼし用の保険 */
function loadLiveCached(dateKey: string, timeZone: string) {
  return unstable_cache(
    () => loadDailyScoreLeadersAdmin(getAdminDb(), { dateKey, timeZone }),
    ["uniterz-daily-score-leaders", dateKey, timeZone],
    { revalidate: 1800, tags: ["uniterz-daily-score-leaders"] }
  )();
}

/**
 * 全試合 settle 済みの日は結果が変わらないので無期限キャッシュ（以後 Firestore を読まない）。
 * 未完了の日は throw してキャッシュさせず、上のライブキャッシュを返す。
 */
async function loadCached(
  dateKey: string,
  timeZone: string
): Promise<DailyScoreLeadersPayload> {
  try {
    return await unstable_cache(
      async () => {
        const payload = await loadLiveCached(dateKey, timeZone);
        if (!payload.complete) throw new DayNotCompleteError(payload);
        return payload;
      },
      ["uniterz-daily-score-leaders-complete", dateKey, timeZone],
      { revalidate: false }
    )();
  } catch (e) {
    if (e instanceof DayNotCompleteError) return e.payload;
    throw e;
  }
}

/** NBA の試合日は米国東部の暦日。全ユーザーが同じ試合日のランキングを見る */
const SLATE_TIME_ZONE = TIMEZONE_ET;

function loadNbaGameDayIndexCached() {
  return unstable_cache(
    async () =>
      loadGameDayIndex(getAdminDb(), {
        league: "nba",
        season: GAME_SCHEDULE_SEASON,
      }),
    ["game-day-index", "nba", GAME_SCHEDULE_SEASON],
    {
      revalidate: 3600,
      tags: ["game-day-index", `game-day-index:nba:${GAME_SCHEDULE_SEASON}`],
    }
  )();
}

/**
 * 開始済みで最新の試合日（Result Drop / TODAY スタッツと同じ基準）。
 * 次の試合日の最初の試合が始まるまで、試合の無い日も前の試合日を出し続ける。
 */
async function loadLatestSlate(): Promise<DailyScoreLeadersPayload> {
  const index = await loadNbaGameDayIndexCached();
  const slateKey = resolveLatestNbaSlateDateKey(index.startMs);
  return loadCached(slateKey, SLATE_TIME_ZONE);
}

/**
 * GET /api/uniterz/daily-leaders?division=standard|open
 * 最新の NBA 試合日（米国東部）の確定 posts から、ユーザーの合計ポイント Top20。
 * division=open（PRO LEAGUE）は Bearer + Pro 必須。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const division: DailyScoreDivision =
      url.searchParams.get("division") === "open" ? "open" : "standard";

    if (division === "open") {
      const uid = await optionalUid(req);
      if (!uid || !(await assertProUser(uid))) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403, headers: { "Cache-Control": "private, no-store" } }
        );
      }
    }

    const payload = await loadLatestSlate();

    const { boards, ...meta } = payload;
    const body = { ...meta, division, rows: boards[division] };

    // URL に日付が無く、次の試合日が始まると中身が切り替わるので CDN は短く（サーバー側は確定日を無期限キャッシュ）
    const cacheControl =
      division === "open"
        ? "private, max-age=60"
        : "public, s-maxage=60, stale-while-revalidate=60";

    return NextResponse.json(body, { headers: { "Cache-Control": cacheControl } });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "invalid_date") {
      return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
    }
    return clientErrorResponse(e, "GET /api/uniterz/daily-leaders");
  }
}
