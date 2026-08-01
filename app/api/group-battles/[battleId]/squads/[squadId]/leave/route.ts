import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  assertRecruitingOrThrow,
  deriveSquadStatusAfterMemberChange,
  getBattle,
  parseSquadDoc,
  squadMembersCol,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string; squadId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId, squadId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    assertRecruitingOrThrow(battle.phase);

    const ref = squadsCol(adminDb, battleId).doc(squadId);
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("squad_not_found");
      const squad = parseSquadDoc(
        snap.id,
        snap.data() as Record<string, unknown>
      );
      if (squad.ownerUid === uid) throw new Error("owner_cannot_leave");
      if (!squad.memberUids.includes(uid)) throw new Error("not_a_member");

      const memberUids = squad.memberUids.filter((u: string) => u !== uid);
      const memberCount = memberUids.length;
      const status = deriveSquadStatusAfterMemberChange(
        memberCount,
        Boolean(squad.rulesAcceptedAtMs)
      );

      tx.update(ref, {
        memberUids,
        memberCount,
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.delete(squadMembersCol(adminDb, battleId).doc(uid));
    });

    return jsonOk({ left: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg === "owner_cannot_leave" ||
      msg === "not_a_member" ||
      msg === "squad_not_found"
    ) {
      return jsonErr(msg, msg === "squad_not_found" ? 404 : 409);
    }
    return mapAuthError(e);
  }
}
