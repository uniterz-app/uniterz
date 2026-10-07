import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";
import {
  getBattle,
  parseSnapshotDoc,
  snapshotRef,
} from "@/lib/groupBattles/server/firestore";
import { loadGroupBattleEntryProfiles } from "@/lib/groupBattles/server/loadEntryProfiles";
import { jsonErr, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

/**
 * 認証必須なので共有キャッシュには入れない（private）。
 * 内容はユーザー非依存だが、CDN に PII 入りレスポンスを置かない。
 */
function rankingsCacheControl(status: "live" | "final" | null): string {
  if (status === "final") return "private, max-age=300";
  return "private, max-age=30";
}

type RankingsResult =
  | { error: "not_found" | "invalid_period" | "label_required"; status: number }
  | {
      body: Record<string, unknown>;
      snapshotStatus: "live" | "final" | null;
    };

/** 中身はユーザー非依存なのでサーバー側は battle × period × label で共有（認証は外で必須） */
async function loadRankingsPayload(
  battleId: string,
  periodRaw: string,
  labelRaw: string
): Promise<RankingsResult> {
  const battle = await getBattle(adminDb, battleId);
  if (!battle) return { error: "not_found", status: 404 };

  const period = periodRaw as GroupBattlePeriod;
  if (period !== "weekly" && period !== "monthly") {
    return { error: "invalid_period", status: 400 };
  }

  let label = labelRaw;
  if (!label) {
    label =
      period === "weekly"
        ? battle.weeklyLabels[battle.weeklyLabels.length - 1] ?? ""
        : battle.monthlyRange.label;
  }
  if (!label) return { error: "label_required", status: 400 };

  const snap = await snapshotRef(adminDb, battleId, period, label).get();
  if (!snap.exists) {
    return {
      body: { ok: true, battleId, period, label, snapshot: null },
      snapshotStatus: null,
    };
  }

  const snapshot = parseSnapshotDoc(
    snap.id,
    snap.data() as Record<string, unknown>
  );

  const uids = [
    ...new Set(
      snapshot.rows.flatMap((r) => r.memberScores.map((m) => m.uid))
    ),
  ];
  const profiles = await loadGroupBattleEntryProfiles(adminDb, uids);
  const rows = snapshot.rows.map((row) => ({
    ...row,
    memberScores: row.memberScores.map((m) => {
      const p = profiles.get(m.uid);
      return {
        ...m,
        displayName: p?.displayName,
        handle: p?.handle ?? null,
        photoURL: p?.photoURL ?? null,
        plan: p?.plan,
        seasonPoints: p?.points,
        winRate: p?.winRate,
        activeWinStreak: p?.activeWinStreak,
        totalPosts: p?.totalPosts,
        thisWeekRank: p?.thisWeekRank ?? null,
        lastWeekRank: p?.lastWeekRank ?? null,
        lastMonthRank: p?.lastMonthRank ?? null,
      };
    }),
  }));

  return {
    body: { ok: true, battleId, period, label, snapshot: { ...snapshot, rows } },
    snapshotStatus: snapshot.status,
  };
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const url = new URL(req.url);
    const period = url.searchParams.get("period") ?? "weekly";
    const label = url.searchParams.get("label") ?? "";

    const result = await unstable_cache(
      () => loadRankingsPayload(battleId, period, label),
      ["group-battle-rankings", battleId, period, label],
      { revalidate: 30, tags: [`group-battle-rankings:${battleId}`] }
    )();

    if ("error" in result) return jsonErr(result.error, result.status);
    return NextResponse.json(result.body, {
      headers: { "Cache-Control": rankingsCacheControl(result.snapshotStatus) },
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
