import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { cancelJoinRequest } from "@/lib/groupBattles/server/cancelJoinRequest";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string; requestId: string }> };

/** 申請者本人による取り下げ */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId, requestId } = await ctx.params;
    const result = await cancelJoinRequest(adminDb, battleId, requestId, uid);
    if (!result.ok) {
      return jsonErr(result.error, result.status);
    }
    return jsonOk({ cancelled: true });
  } catch (e) {
    return mapAuthError(e);
  }
}
