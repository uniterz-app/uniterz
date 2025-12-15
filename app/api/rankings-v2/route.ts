// app/api/rankings-v2/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import type {
  Period,
  LeagueTab,
  Metric,
  RankingResponse,
} from "@/lib/rankings/types";

export const runtime = "nodejs";

/* ---------------------------
  period → calendar kind
---------------------------- */
function periodToKind(period: Period): "week" | "month" {
  return period === "week" ? "week" : "month";
}

/* ---------------------------
 GET /api/rankings-v2
---------------------------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const period = (searchParams.get("period") ?? "week") as Period;
  const league = (searchParams.get("league") ?? "nba") as LeagueTab;
  const metric = (searchParams.get("metric") ?? "winRate") as Metric;

  const kind = periodToKind(period);

  try {
    /* ---------------------------
      最新のランキング doc を 1 件取得
    ---------------------------- */
    const snap = await adminDb
      .collection("leaderboards_calendar_v2")
      .where("kind", "==", kind)
      .where("league", "==", league)
      .orderBy("startAtJst", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { rows: [] } satisfies RankingResponse,
        { status: 200 }
      );
    }

    /* ---------------------------
      Top10 をそのまま返す
    ---------------------------- */
    const data = snap.docs[0].data() as any;

const rows = data?.top10?.[metric] ?? [];

const periodInfo = {
  startAt: data.startAtJst?.toDate
    ? data.startAtJst.toDate().toISOString()
    : null,
  endAt: data.endAtJst?.toDate
    ? data.endAtJst.toDate().toISOString()
    : null,
};

return NextResponse.json(
  {
    rows,
    period: periodInfo,
  },
  {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=600",
    },
  }
);

  } catch (e: any) {
    console.error("rankings-v2 API error:", e);
    return NextResponse.json(
      {
        rows: [],
        error: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}

