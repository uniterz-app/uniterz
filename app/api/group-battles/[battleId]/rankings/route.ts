import { NextResponse } from "next/server";
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

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);

    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ??
      "weekly") as GroupBattlePeriod;
    if (period !== "weekly" && period !== "monthly") {
      return jsonErr("invalid_period", 400);
    }

    let label = url.searchParams.get("label") ?? "";
    if (!label) {
      label =
        period === "weekly"
          ? battle.weeklyLabels[battle.weeklyLabels.length - 1] ?? ""
          : battle.monthlyRange.label;
    }
    if (!label) return jsonErr("label_required", 400);

    const snap = await snapshotRef(adminDb, battleId, period, label).get();
    if (!snap.exists) {
      return NextResponse.json(
        {
          ok: true,
          battleId,
          period,
          label,
          snapshot: null,
        },
        { headers: { "Cache-Control": rankingsCacheControl(null) } }
      );
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

    return NextResponse.json(
      {
        ok: true,
        battleId,
        period,
        label,
        snapshot: { ...snapshot, rows },
      },
      { headers: { "Cache-Control": rankingsCacheControl(snapshot.status) } }
    );
  } catch (e) {
    return mapAuthError(e);
  }
}
