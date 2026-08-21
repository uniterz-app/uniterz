import { GROUP_BATTLE_MAX_MEMBERS } from "@/lib/groupBattles/constants";
import {
  assertRecruitingOrThrow,
  cancelPendingJoinRequestsTx,
  deriveSquadStatusAfterMemberChange,
  getBattle,
  getPendingJoinRequestsTx,
  joinRequestsCol,
  parseJoinRequest,
  parseSquadDoc,
  squadMembersCol,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk } from "@/lib/groupBattles/server/http";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function resolveJoinRequest(
  req: Request,
  battleId: string,
  requestId: string,
  decision: "approved" | "rejected"
): Promise<NextResponse> {
  const uid = await requireUidFromRequest(req);
  const battle = await getBattle(adminDb, battleId);
  if (!battle) return jsonErr("not_found", 404);
  assertRecruitingOrThrow(battle.phase);

  const reqRef = joinRequestsCol(adminDb, battleId).doc(requestId);

  await adminDb.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new Error("request_not_found");
    const joinReq = parseJoinRequest(
      reqSnap.id,
      reqSnap.data() as Record<string, unknown>
    );
    if (joinReq.status !== "pending") throw new Error("not_pending");

    const squadRef = squadsCol(adminDb, battleId).doc(joinReq.squadId);
    const squadSnap = await tx.get(squadRef);
    if (!squadSnap.exists) throw new Error("squad_not_found");
    const squad = parseSquadDoc(
      squadSnap.id,
      squadSnap.data() as Record<string, unknown>
    );
    if (squad.ownerUid !== uid) throw new Error("forbidden");

    if (decision === "rejected") {
      tx.update(reqRef, {
        status: "rejected",
        resolvedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const applicantUid = joinReq.applicantUid;
    const memRef = squadMembersCol(adminDb, battleId).doc(applicantUid);
    const memSnap = await tx.get(memRef);
    if (memSnap.exists) throw new Error("applicant_already_in_squad");
    if (squad.memberCount >= GROUP_BATTLE_MAX_MEMBERS) {
      throw new Error("squad_full");
    }

    const pendingSnap = await getPendingJoinRequestsTx(
      tx,
      adminDb,
      battleId,
      applicantUid
    );

    const memberUids = [...squad.memberUids, applicantUid];
    const memberCount = memberUids.length;
    const status = deriveSquadStatusAfterMemberChange(
      memberCount,
      Boolean(squad.rulesAcceptedAtMs)
    );

    tx.update(squadRef, {
      memberUids,
      memberCount,
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(memRef, {
      squadId: joinReq.squadId,
      role: "member",
      joinedAt: FieldValue.serverTimestamp(),
    });
    tx.update(reqRef, {
      status: "approved",
      resolvedAt: FieldValue.serverTimestamp(),
    });
    cancelPendingJoinRequestsTx(tx, pendingSnap, requestId);
  });

  return jsonOk({ decision });
}
