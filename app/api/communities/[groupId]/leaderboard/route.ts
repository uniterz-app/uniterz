import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertMember } from "@/lib/communities/groupAccess";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";
import { buildMemberLeaderboard } from "@/lib/communities/groupStats";
import { readRankingTeamIds } from "@/lib/communities/rankingTeams";
import { resolveRankingStartDateKey, resolveRankingStartAtMs } from "@/lib/communities/rankingStartDate";
import {
  getCachedLeaderboardResponse,
  setCachedLeaderboardResponse,
} from "@/lib/communities/leaderboardResponseCache";
import {
  getLeaderboardSnapshotSlotKeyJst,
  isLeaderboardSnapshotFresh,
  readLeaderboardSnapshot,
  writeLeaderboardSnapshot,
} from "@/lib/communities/leaderboardSnapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

function sameTeamIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertMember(adminDb, groupId, uid);
    const d = groupSnap.data()!;
    const rankingMetric = parseCommunityMetric(d.rankingMetric);
    const periodType = parseCommunityPeriod(d.periodType);
    const rankingLeague = parseCommunityLeague(d.rankingLeague);
    const rankingTeamIds = readRankingTeamIds(d);
    const rankingStartDateKey = resolveRankingStartDateKey(d);
    const rankingStartAtMs = resolveRankingStartAtMs(d);
    const snapshotSlotKey = getLeaderboardSnapshotSlotKeyJst();

    const members = await adminDb
      .collection(`groups/${groupId}/members`)
      .get();
    const memberUids = members.docs.map((x) => x.id);
    const memberUidSample = memberUids
      .slice(0, 8)
      .sort()
      .join(",");

    const cacheParams = {
      groupId,
      rankingMetric,
      rankingLeague,
      rankingTeamIds,
      periodType,
      rankingStartDateKey,
      rankingStartAtMs,
      memberCount: memberUids.length,
      topMemberUidSample: memberUidSample,
    } as const;

    const cached = getCachedLeaderboardResponse(cacheParams);
    if (cached) {
      return NextResponse.json(cached);
    }

    const snapshot = await readLeaderboardSnapshot(
      adminDb,
      groupId,
      snapshotSlotKey
    );
    if (
      snapshot &&
      isLeaderboardSnapshotFresh(snapshot.builtAtMs) &&
      snapshot.rankingMetric === rankingMetric &&
      snapshot.rankingLeague === rankingLeague &&
      sameTeamIds(snapshot.rankingTeamIds, rankingTeamIds) &&
      snapshot.periodType === periodType &&
      snapshot.rankingStartDateKey === rankingStartDateKey &&
      snapshot.rankingStartAtMs === rankingStartAtMs &&
      snapshot.memberCount === memberUids.length
    ) {
      const myRowFromSnapshot =
        snapshot.rows.find((x) => x.uid === uid) ?? null;
      const payload = {
        ok: true as const,
        rankingMetric,
        periodType,
        rankingLeague,
        rows: snapshot.rows,
        myRow: myRowFromSnapshot,
      };
      setCachedLeaderboardResponse(cacheParams, payload);
      return NextResponse.json(payload);
    }

    const rows = await buildMemberLeaderboard(
      adminDb,
      memberUids,
      rankingMetric,
      periodType,
      rankingLeague,
      rankingStartDateKey,
      rankingTeamIds,
      rankingStartAtMs
    );

    const ranked = rows.map((r, i) => ({
      rank: i + 1,
      uid: r.uid,
      displayName: r.displayName,
      handle: r.handle,
      photoURL: r.photoURL,
      plan: r.plan,
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

    const payload = {
      ok: true,
      rankingMetric,
      periodType,
      rankingLeague,
      rows: ranked,
      myRow,
    } as const;
    await writeLeaderboardSnapshot(adminDb, groupId, {
      slotKey: snapshotSlotKey,
      rankingMetric,
      rankingLeague,
      rankingTeamIds,
      periodType,
      rankingStartDateKey,
      rankingStartAtMs,
      memberCount: memberUids.length,
      rows: ranked,
      builtAtMs: Date.now(),
    });
    setCachedLeaderboardResponse(cacheParams, payload);
    return NextResponse.json(payload);
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
