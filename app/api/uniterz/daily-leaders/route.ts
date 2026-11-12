import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
import type { DailyScoreDivision } from "@/lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";
import {
  loadLatestDailyScoreSlate,
  selectDailyScoreBoardRowsCached,
} from "@/lib/rankings/dailyScoreLeaders/dailyScoreLeadersServerCache";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";

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

/**
 * GET /api/uniterz/daily-leaders?division=standard|open
 * 最新の NBA 試合日（米国東部）の確定 posts から、ユーザーの合計ポイント Top50。
 * division=open（PRO LEAGUE）は Bearer + Pro 必須。自分の順位は `/api/uniterz/daily-leaders/me`。
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

    const payload = await loadLatestDailyScoreSlate();

    const { boards, ...meta } = payload;
    const rows = await selectDailyScoreBoardRowsCached(boards[division], meta.dateKey, division);
    const body = { ...meta, division, rows };

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
