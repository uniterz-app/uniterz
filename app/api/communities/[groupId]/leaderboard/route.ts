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
import {
  resolveRankingStartDateKey,
  resolveRankingStartAtMs,
} from "@/lib/communities/rankingStartDate";
import {
  getCachedLeaderboardResponse,
  setCachedLeaderboardResponse,
} from "@/lib/communities/leaderboardResponseCache";
import {
  getLeaderboardSnapshotSlotKeyJst,
  readLeaderboardSnapshot,
  writeLeaderboardSnapshot,
} from "@/lib/communities/leaderboardSnapshot";
import { buildCommunityGroupSummaryPayload } from "@/lib/communities/buildCommunityGroupSummaryPayload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

function sameTeamIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function snapshotMatchesGroup(
  snapshot: NonNullable<Awaited<ReturnType<typeof readLeaderboardSnapshot>>>,
  opts: {
    rankingMetric: ReturnType<typeof parseCommunityMetric>;
    rankingLeague: ReturnType<typeof parseCommunityLeague>;
    rankingTeamIds: string[];
    periodType: ReturnType<typeof parseCommunityPeriod>;
    rankingStartDateKey: string;
    rankingStartAtMs: number;
  }
): boolean {
  return (
    snapshot.rankingMetric === opts.rankingMetric &&
    snapshot.rankingLeague === opts.rankingLeague &&
    sameTeamIds(snapshot.rankingTeamIds, opts.rankingTeamIds) &&
    snapshot.periodType === opts.periodType &&
    snapshot.rankingStartDateKey === opts.rankingStartDateKey &&
    snapshot.rankingStartAtMs === opts.rankingStartAtMs
  );
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertMember(adminDb, groupId, uid);
    const d = groupSnap.data()!;
    const group = buildCommunityGroupSummaryPayload(groupId, d, uid);
    const rankingMetric = parseCommunityMetric(d.rankingMetric);
    const periodType = parseCommunityPeriod(d.periodType);
    const rankingLeague = parseCommunityLeague(d.rankingLeague);
    const rankingTeamIds = readRankingTeamIds(d);
    const rankingStartDateKey = resolveRankingStartDateKey(d);
    const rankingStartAtMs = resolveRankingStartAtMs(d);
    const snapshotSlotKey = getLeaderboardSnapshotSlotKeyJst();
    const rankingOpts = {
      rankingMetric,
      rankingLeague,
      rankingTeamIds,
      periodType,
      rankingStartDateKey,
      rankingStartAtMs,
    };

    /**
     * 日次スロット（JST 16:00）の snapshot があれば members 全読・daily 再集計しない。
     * ランキングと同じ「1日1回」モデル。
     */
    const snapshot = await readLeaderboardSnapshot(
      adminDb,
      groupId,
      snapshotSlotKey
    );
        if (snapshot && snapshotMatchesGroup(snapshot, rankingOpts)) {
      const myRowFromSnapshot =
        snapshot.rows.find((x) => x.uid === uid) ?? null;
      const payload = {
        ok: true as const,
        group,
        rankingMetric,
        periodType,
        rankingLeague,
        rows: snapshot.rows,
        myRow: myRowFromSnapshot,
      };
      setCachedLeaderboardResponse(
        {
          groupId,
          rankingMetric,
          rankingLeague,
          rankingTeamIds,
          periodType,
          rankingStartDateKey,
          rankingStartAtMs,
          memberCount: snapshot.memberCount,
          topMemberUidSample: "",
        },
        payload
      );
      return NextResponse.json(payload, {
        headers: {
          // 認証付きのため CDN 公開はしない。同一ブラウザの短再取得だけ抑える
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    const members = await adminDb
      .collection(`groups/${groupId}/members`)
      .get();
    const memberUids = members.docs.map((x) => x.id);
    const memberUidSample = memberUids.slice(0, 8).sort().join(",");

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
      return NextResponse.json({ ...cached, group });
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
      totalUpset: r.totalUpset,
      activeWinStreak: r.activeWinStreak,
      sortValue: r.sortValue,
    }));

    const myRow = ranked.find((x) => x.uid === uid) ?? null;

    const payload = {
      ok: true,
      group,
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
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
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
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
