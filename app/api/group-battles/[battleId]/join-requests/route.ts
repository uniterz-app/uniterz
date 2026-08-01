import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  GROUP_BATTLE_MAX_MEMBERS,
  GROUP_BATTLE_MAX_PENDING_APPLICATIONS,
} from "@/lib/groupBattles/constants";
import {
  assertRecruitingOrThrow,
  countPendingApplications,
  getBattle,
  getMembership,
  joinRequestsCol,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
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

    const membership = await getMembership(adminDb, battleId, uid);
    if (membership) return jsonErr("already_in_squad", 409);

    const pending = await countPendingApplications(adminDb, battleId, uid);
    if (pending >= GROUP_BATTLE_MAX_PENDING_APPLICATIONS) {
      return jsonErr("pending_limit", 429, {
        max: GROUP_BATTLE_MAX_PENDING_APPLICATIONS,
      });
    }

    const body = await req.json().catch(() => ({}));
    const squadId = String(body?.squadId ?? "").trim();
    if (!squadId) return jsonErr("invalid_squad", 400);

    const squadSnap = await squadsCol(adminDb, battleId).doc(squadId).get();
    if (!squadSnap.exists) return jsonErr("squad_not_found", 404);
    const squad = parseSquadDoc(
      squadSnap.id,
      squadSnap.data() as Record<string, unknown>
    );
    if (squad.memberCount >= GROUP_BATTLE_MAX_MEMBERS) {
      return jsonErr("squad_full", 409);
    }

    const dup = await joinRequestsCol(adminDb, battleId)
      .where("applicantUid", "==", uid)
      .where("squadId", "==", squadId)
      .where("status", "==", "pending")
      .limit(1)
      .get();
    if (!dup.empty) return jsonErr("already_pending", 409);

    const ref = joinRequestsCol(adminDb, battleId).doc();
    await ref.set({
      squadId,
      applicantUid: uid,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      resolvedAt: null,
    });

    return jsonOk({ requestId: ref.id });
  } catch (e) {
    return mapAuthError(e);
  }
}
