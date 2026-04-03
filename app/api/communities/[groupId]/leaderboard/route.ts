import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertMember } from "@/lib/communities/groupAccess";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";
import { buildMemberLeaderboard } from "@/lib/communities/groupStats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertMember(adminDb, groupId, uid);
    const d = groupSnap.data()!;
    const rankingMetric = parseCommunityMetric(d.rankingMetric);
    const periodType = parseCommunityPeriod(d.periodType);

    const members = await adminDb
      .collection(`groups/${groupId}/members`)
      .get();
    const memberUids = members.docs.map((x) => x.id);

    const rows = await buildMemberLeaderboard(
      adminDb,
      memberUids,
      rankingMetric,
      periodType
    );

    const ranked = rows.map((r, i) => ({
      rank: i + 1,
      uid: r.uid,
      displayName: r.displayName,
      handle: r.handle,
      photoURL: r.photoURL,
      countryCode: r.countryCode,
      totalPosts: r.totalPosts,
      totalWins: r.totalWins,
      winRate: r.winRate,
      totalPoints: r.totalPoints,
      totalPrecision: r.totalPrecision,
      totalUpset: r.totalUpset,
      activeWinStreak: r.activeWinStreak,
      sortValue: r.sortValue,
    }));

    const myRow = ranked.find((x) => x.uid === uid) ?? null;

    return NextResponse.json({
      ok: true,
      rankingMetric,
      periodType,
      rows: ranked,
      myRow,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    const status = (e as { status?: number }).status;
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    if (status === 404)
      return NextResponse.json({ ok: false, error: msg }, { status: 404 });
    if (status === 403)
      return NextResponse.json({ ok: false, error: msg }, { status: 403 });
    console.error("[communities/leaderboard]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
