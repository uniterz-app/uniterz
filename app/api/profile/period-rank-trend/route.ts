/**
 * GET /api/profile/period-rank-trend?uid=&period=weekly|monthly&division=standard|open
 * プロフィール RANKING PROGRESS の WEEKLY / MONTHLY（期間ごとの総合得点順位）。
 * Firestore の period_ranking_snapshots を自分の uid だけ fieldMask で読む（BDL なし）。
 *
 * standard（PICK UP）は公開・CDN キャッシュ。open（PRO LEAGUE）は Bearer + Pro のみ。
 */
import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertProUser } from "@/lib/pro/assertProUser";
import { parseRankingDivision } from "@/lib/rankings/rankingDivision";
import { loadPeriodRankTrend } from "@/lib/rankings/server/loadPeriodRankTrend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidUid(value: string): boolean {
  return value.length > 0 && value.length <= 128 && !value.includes("/");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("uid")?.trim() ?? "";
    const period = url.searchParams.get("period")?.trim() ?? "";
    const division = parseRankingDivision(url.searchParams.get("division"));

    if (!isValidUid(uid)) {
      return NextResponse.json(
        { ok: false, error: "uid is required" },
        { status: 400 }
      );
    }
    if (period !== "weekly" && period !== "monthly") {
      return NextResponse.json(
        { ok: false, error: "period must be weekly or monthly" },
        { status: 400 }
      );
    }

    if (division === "open") {
      let callerUid: string;
      try {
        callerUid = await requireUidFromRequest(req);
      } catch {
        return NextResponse.json(
          { ok: false, error: "unauthorized" },
          { status: 401 }
        );
      }
      if (!(await assertProUser(callerUid))) {
        return NextResponse.json(
          { ok: false, error: "pro_required" },
          { status: 403 }
        );
      }
    }

    const points = await loadPeriodRankTrend({ uid, period, division });
    return NextResponse.json(
      { ok: true, period, division, points },
      {
        headers: {
          "Cache-Control":
            division === "open"
              ? "private, max-age=60"
              : "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    console.error("[period-rank-trend]", e);
    return NextResponse.json(
      { ok: false, error: "internal" },
      { status: 500 }
    );
  }
}
