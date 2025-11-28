// app/api/rankings/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import type {
  Period,
  LeagueTab,
  Metric,
  RankingRow,
  RankingResponse,
} from "@/lib/rankings/types";
import { buildBadges } from "@/lib/stats/buildBadges";
import { getMockRows } from "@/lib/rankings/mock";

export const runtime = "nodejs";

/** period を 週間 / 月間 のどちらとして扱うか */
function periodToCalendarKind(period: Period): "week" | "month" {
  if (period === "7d") return "week";
  // 30d も all もまとめて「月間」として扱う
  return "month";
}

/**
 * leaderboards_calendar から
 * kind + league に対応する「最新ドキュメント」を 1 件取る
 *
 * - docId: `${kind}_${league}_${periodId}` という形で作っているので
 *   kind と league の両方で絞る
 */
async function getLatestCalendarDoc(
  kind: "week" | "month",
  league: LeagueTab
) {
  const snap = await adminDb
    .collection("leaderboards_calendar")
    .where("kind", "==", kind)
    .where("league", "==", league) // ★ league でも絞る
    .orderBy("startAtJst", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0];
}

/** ソート関数（従来ロジックそのまま） */
function sortRows(rows: RankingRow[], metric: Metric) {
  const sortByUnits = (a: RankingRow, b: RankingRow) =>
    b.units - a.units ||
    b.winRate - a.winRate ||
    b.posts - a.posts ||
    b.postsTotal - a.postsTotal ||
    (a.uid < b.uid ? -1 : 1);

  const sortByWinRate = (a: RankingRow, b: RankingRow) =>
    b.winRate - a.winRate ||
    b.posts - a.posts ||
    b.units - a.units ||
    b.postsTotal - a.postsTotal ||
    (a.uid < b.uid ? -1 : 1);

  rows.sort(metric === "winRate" ? sortByWinRate : sortByUnits);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const period = (searchParams.get("period") ?? "30d") as Period; // "7d" | "30d" | "all"
  const league = (searchParams.get("league") ?? "all") as LeagueTab; // "all" | "b1" | "j1"
  const metric = (searchParams.get("metric") ?? "units") as Metric;   // "units" | "winRate"
  const limit = Number(searchParams.get("limit") ?? 50);

  // ===== 1) モックモード（UI検証用） =====
  if (searchParams.get("mock") === "1") {
    const rows = getMockRows(period, league, metric).slice(0, limit);
    const payload: RankingResponse = { rows };
    return NextResponse.json(payload, { status: 200 });
  }

  try {
    // ===== 2) カレンダーベース leaderboard から取得 =====
    const kind = periodToCalendarKind(period); // "week" | "month"

    // ★ kind + league に対応する doc を取る
    const lbDoc = await getLatestCalendarDoc(kind, league);

    // まだ一度も集計が走っていない場合
    if (!lbDoc) {
      const empty: RankingResponse = { rows: [] };
      return NextResponse.json(empty, { status: 200 });
    }

    // 該当期間ドキュメントの users サブコレクションを読む
    const usersSnap = await lbDoc.ref.collection("users").get();
    const rows: RankingRow[] = [];

    for (const doc of usersSnap.docs) {
      const d = doc.data() as any;

      // safety: 古いデータで league フィールドが無い場合に備えたフィルタ
      const userLeague = (d.league as LeagueTab) ?? "all";
      if (league !== "all" && userLeague !== league) continue;

      const posts   = Number(d.posts ?? 0);
      const hit     = Number(d.hit ?? 0);
      const units   = Number(d.units ?? 0);
      const oddsSum = Number(d.oddsSum ?? 0);
      const oddsCnt = Number(d.oddsCnt ?? 0);

      const winRate = Number(
        d.winRate ?? (posts > 0 ? hit / posts : 0)
      );
      const avgOdds = Number(
        d.avgOdds ?? (oddsCnt > 0 ? oddsSum / oddsCnt : 0)
      );
      const postsTotal = Number(d.postsTotal ?? 0);

      rows.push({
        uid: d.uid ?? doc.id,
        displayName: d.displayName ?? "user",
        photoURL: d.photoURL ?? undefined,
        postsTotal,
        posts,
        hit,
        winRate,
        avgOdds,
        units,
        badges: buildBadges({ period, winRate, avgOdds, units }),
      });
    }

    // metric に応じて並び替え
    sortRows(rows, metric);

    const payload: RankingResponse = {
      rows: rows.slice(0, limit),
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    console.error("rankings API error:", e);
    const payload: RankingResponse & { error?: string } = {
      rows: [],
      nextCursor: undefined,
      error: e?.message ?? String(e),
    };
    return NextResponse.json(payload, { status: 500 });
  }
}

