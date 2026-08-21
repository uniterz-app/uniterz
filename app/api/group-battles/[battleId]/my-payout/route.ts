import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { loadMyGroupBattlePayout } from "@/lib/groupBattles/server/loadMyPayout";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

/** 自分の週間×4 + 月間 Unit（台帳優先、未付与は FINAL スナップから推定） */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    if (!battleId) return jsonErr("not_found", 404);
    const payout = await loadMyGroupBattlePayout(adminDb, battleId, uid);
    return jsonOk({ payout });
  } catch (e) {
    return mapAuthError(e);
  }
}
