import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { assertProUser } from "@/lib/rankings/server/fetchRankGapAnalysis";
import type {
  DailyScoreDivision,
  DailyScoreMeResponse,
} from "@/lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";
import {
  loadLatestDailyScoreSlate,
  rankDailyScoreCandidatesCached,
} from "@/lib/rankings/dailyScoreLeaders/dailyScoreLeadersServerCache";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

/**
 * GET /api/uniterz/daily-leaders/me?division=standard|open（Bearer 必須）
 * 一覧（上位 50・CDN 共有）と同じ試合日で、自分の順位・合計ポイント・予想数・的中数。
 * division=open は Pro のみ。順位は今の Pro だけで振り直した PRO LEAGUE の順位。
 */
export async function GET(req: Request) {
  try {
    const authz = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: NO_STORE });
    let uid: string;
    try {
      uid = (await getAdminAuth().verifyIdToken(token)).uid;
    } catch {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: NO_STORE });
    }

    const url = new URL(req.url);
    const division: DailyScoreDivision = url.searchParams.get("division") === "open" ? "open" : "standard";
    if (division === "open" && !(await assertProUser(uid))) {
      return NextResponse.json({ ok: false, error: "pro_required" }, { status: 403, headers: NO_STORE });
    }

    const payload = await loadLatestDailyScoreSlate();
    const candidates = payload.boards[division];
    const { total, ranks } = await rankDailyScoreCandidatesCached(candidates, payload.dateKey, division);
    const row = candidates.find((r) => r.uid === uid);
    const rank = ranks[uid];
    const body: DailyScoreMeResponse = {
      ok: true,
      dateKey: payload.dateKey,
      division,
      total,
      me: row && rank ? { rank, points: row.points, posts: row.posts, wins: row.wins } : null,
    };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (e: unknown) {
    return clientErrorResponse(e, "GET /api/uniterz/daily-leaders/me");
  }
}
