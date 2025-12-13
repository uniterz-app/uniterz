// app/api/rankings-v2/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import type {
  Period,
  LeagueTab,
  Metric,
  RankingRow,
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
 sort function (V2仕様)
---------------------------- */
function sortRows(rows: RankingRow[], metric: Metric) {
  rows.sort((a, b) => {
    return (
      (Number(b[metric] ?? 0) - Number(a[metric] ?? 0)) ||
      (b.posts ?? 0) - (a.posts ?? 0)
    );
  });
}

/* ---------------------------
 GET /api/rankings-v2
---------------------------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const period = (searchParams.get("period") ?? "week") as Period;
  const league = (searchParams.get("league") ?? "nba") as LeagueTab;
  const metric = (searchParams.get("metric") ?? "winRate") as Metric;
  const limit = Number(searchParams.get("limit") ?? 50);

  const kind = periodToKind(period); // "week" | "month"

  try {
    /* ---------------------------
      leaderboards_calendar_v2 から最新を取得
    ---------------------------- */
    const snap = await adminDb
      .collection("leaderboards_calendar_v2")
      .where("kind", "==", kind)
      .where("league", "==", league)
      .orderBy("startAtJst", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ rows: [] } satisfies RankingResponse, {
        status: 200,
      });
    }

    const lbDoc = snap.docs[0];

    /* ---------------------------
      users サブコレクションを読む
    ---------------------------- */
    const usersSnap = await lbDoc.ref.collection("users").get();

    const rows: RankingRow[] = [];

    for (const doc of usersSnap.docs) {
      const d = doc.data() as any;
      const uid = d.uid ?? doc.id;

      /* ---------------------------
        users/{uid} から JOIN （名前 + アイコン）
      ---------------------------- */
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const user = userDoc.exists ? userDoc.data() : {};

      rows.push({
  uid,
  displayName: user?.displayName ?? "user",
  photoURL: user?.photoURL ?? undefined,

  posts: d.posts ?? 0,
  winRate: d.winRate ?? 0,
  accuracy: d.accuracy ?? 0,
  consistency: d.consistency ?? 0, // ← 追加
  avgPrecision: d.avgPrecision ?? undefined,
  avgUpset: d.avgUpset ?? undefined,
});
    }

    /* ---------------------------
      ソート（V2仕様）
    ---------------------------- */
    sortRows(rows, metric);

    /* ---------------------------
      limit 件返す
    ---------------------------- */
    const payload: RankingResponse = {
      rows: rows.slice(0, limit),
    };

    return NextResponse.json(payload, { status: 200 });
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

