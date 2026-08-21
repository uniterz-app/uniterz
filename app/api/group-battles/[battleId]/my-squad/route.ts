import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  getBattle,
  getMembership,
  parseSquadDoc,
  serializeSquadForClient,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);

    const membership = await getMembership(adminDb, battleId, uid);
    if (!membership) {
      return jsonOk({ membership: null, squad: null });
    }

    const snap = await squadsCol(adminDb, battleId)
      .doc(membership.squadId)
      .get();
    if (!snap.exists) {
      return jsonOk({ membership, squad: null });
    }

    const squad = parseSquadDoc(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    return jsonOk({
      membership,
      squad: serializeSquadForClient(squad, { viewerUid: uid }),
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
