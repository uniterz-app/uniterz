import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/communities/inviteCode";
import {
  GROUP_BATTLE_MAX_MEMBERS,
} from "@/lib/groupBattles/constants";
import {
  assertRecruitingOrThrow,
  battleRef,
  getBattle,
  getMembership,
  sanitizeSquadName,
  squadMembersCol,
  squadsCol,
  cancelPendingJoinRequestsTx,
  getPendingJoinRequestsTx,
} from "@/lib/groupBattles/server/firestore";
import { squadInviteCodeWriteFields } from "@/lib/groupBattles/server/inviteCodeWrite";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    assertRecruitingOrThrow(battle.phase);

    const existing = await getMembership(adminDb, battleId, uid);
    if (existing) return jsonErr("already_in_squad", 409);

    const body = await req.json().catch(() => ({}));
    const name = sanitizeSquadName(body?.name);
    if (!name) return jsonErr("invalid_name", 400);
    const acceptRules = Boolean(body?.acceptRules);
    if (!acceptRules) return jsonErr("rules_required", 400);

    let invitePlain = "";
    let hash = "";
    for (let attempt = 0; attempt < 8; attempt++) {
      invitePlain = generateInviteCode();
      hash = hashInviteCode(invitePlain);
      const clash = await squadsCol(adminDb, battleId)
        .where("inviteCodeHash", "==", hash)
        .limit(1)
        .get();
      if (clash.empty) break;
      invitePlain = "";
    }
    if (!invitePlain) return jsonErr("invite_code_exhausted", 500);

    const squadRef = squadsCol(adminDb, battleId).doc();
    const now = FieldValue.serverTimestamp();

    await adminDb.runTransaction(async (tx) => {
      const memRef = squadMembersCol(adminDb, battleId).doc(uid);
      const memSnap = await tx.get(memRef);
      if (memSnap.exists) throw new Error("already_in_squad");

      const pendingSnap = await getPendingJoinRequestsTx(
        tx,
        adminDb,
        battleId,
        uid
      );

      tx.set(squadRef, {
        name,
        ownerUid: uid,
        memberUids: [uid],
        memberCount: 1,
        status: "forming",
        ...squadInviteCodeWriteFields(invitePlain),
        rulesAcceptedAt: now,
        rulesAcceptedByUid: uid,
        createdAt: now,
        updatedAt: now,
      });
      tx.set(memRef, {
        squadId: squadRef.id,
        role: "owner",
        joinedAt: now,
      });
      tx.set(
        battleRef(adminDb, battleId),
        { updatedAt: now },
        { merge: true }
      );
      cancelPendingJoinRequestsTx(tx, pendingSnap);
    });

    return jsonOk({
      squadId: squadRef.id,
      inviteCode: invitePlain,
      maxMembers: GROUP_BATTLE_MAX_MEMBERS,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "already_in_squad") return jsonErr("already_in_squad", 409);
    return mapAuthError(e);
  }
}
