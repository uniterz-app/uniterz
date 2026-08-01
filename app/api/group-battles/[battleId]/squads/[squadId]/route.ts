import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  assertRecruitingOrThrow,
  getBattle,
  parseSquadDoc,
  sanitizeSquadName,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string; squadId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId, squadId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    assertRecruitingOrThrow(battle.phase);

    const body = await req.json().catch(() => ({}));
    const name = sanitizeSquadName(body?.name);
    if (!name) return jsonErr("invalid_name", 400);

    const ref = squadsCol(adminDb, battleId).doc(squadId);
    const snap = await ref.get();
    if (!snap.exists) return jsonErr("squad_not_found", 404);
    const squad = parseSquadDoc(snap.id, snap.data() as Record<string, unknown>);
    if (squad.ownerUid !== uid) return jsonErr("forbidden", 403);

    await ref.update({
      name,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return jsonOk({ squadId, name });
  } catch (e) {
    return mapAuthError(e);
  }
}
