import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getBattle } from "@/lib/groupBattles/server/firestore";
import { listIncomingPendingInvites } from "@/lib/groupBattles/server/invites";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

/** 自分宛の pending 招待一覧 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    const invites = await listIncomingPendingInvites(adminDb, battleId, uid);
    return jsonOk({ invites });
  } catch (e) {
    return mapAuthError(e);
  }
}
