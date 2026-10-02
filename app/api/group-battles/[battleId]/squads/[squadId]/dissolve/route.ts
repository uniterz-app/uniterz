import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { dissolveSquad } from "@/lib/groupBattles/server/dissolveSquad";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string; squadId: string }> };

/** オーナー解散 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId, squadId } = await ctx.params;
    const result = await dissolveSquad(adminDb, battleId, squadId, uid);
    if (!result.ok) {
      return jsonErr(result.error, result.status);
    }
    return jsonOk({ dissolved: true });
  } catch (e) {
    return mapAuthError(e);
  }
}
