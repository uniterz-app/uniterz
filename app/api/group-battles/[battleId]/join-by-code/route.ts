import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  hashInviteCode,
  normalizeInviteCode,
} from "@/lib/communities/inviteCode";
import {
  GROUP_BATTLE_MAX_MEMBERS,
  GROUP_BATTLE_MIN_MEMBERS,
} from "@/lib/groupBattles/constants";
import {
  assertRecruitingOrThrow,
  deriveSquadStatusAfterMemberChange,
  getBattle,
  getMembership,
  parseSquadDoc,
  squadMembersCol,
  squadsCol,
  cancelPendingJoinRequestsTx,
  getPendingJoinRequestsTx,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";
import { consumeRateLimit, RATE_LIMIT_RULES } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

/** 招待コードだけでスクワッドを特定して参加 */
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
    const code = normalizeInviteCode(String(body?.inviteCode ?? ""));
    if (!code) return jsonErr("invalid_invite", 400);

    // コードを総当たりされると他人のスクワッドに入れてしまうため上限を入れる
    const limit = await consumeRateLimit(
      adminDb,
      RATE_LIMIT_RULES.inviteCodeLookup,
      uid
    );
    if (!limit.allowed) {
      return jsonErr("rate_limited", 429, { retryAfterSec: limit.retryAfterSec });
    }

    const hash = hashInviteCode(code);

    const found = await squadsCol(adminDb, battleId)
      .where("inviteCodeHash", "==", hash)
      .limit(1)
      .get();
    if (found.empty) return jsonErr("invalid_invite", 404);
    const squadRef = found.docs[0]!.ref;

    let squadId = squadRef.id;
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(squadRef);
      if (!snap.exists) throw new Error("squad_not_found");
      const squad = parseSquadDoc(
        snap.id,
        snap.data() as Record<string, unknown>
      );
      squadId = squad.id;
      if (squad.inviteCodeHash !== hash) throw new Error("invalid_invite");
      if (squad.memberCount >= GROUP_BATTLE_MAX_MEMBERS) {
        throw new Error("squad_full");
      }

      const memRef = squadMembersCol(adminDb, battleId).doc(uid);
      const memSnap = await tx.get(memRef);
      if (memSnap.exists) throw new Error("already_in_squad");

      const pendingSnap = await getPendingJoinRequestsTx(
        tx,
        adminDb,
        battleId,
        uid
      );

      const memberUids = [...squad.memberUids, uid];
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
        squadId: squad.id,
        role: "member",
        joinedAt: FieldValue.serverTimestamp(),
      });
      cancelPendingJoinRequestsTx(tx, pendingSnap);
    });

    return jsonOk({
      squadId,
      minMembers: GROUP_BATTLE_MIN_MEMBERS,
      maxMembers: GROUP_BATTLE_MAX_MEMBERS,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg === "invalid_invite" ||
      msg === "squad_full" ||
      msg === "already_in_squad" ||
      msg === "squad_not_found"
    ) {
      return jsonErr(
        msg,
        msg === "squad_not_found" || msg === "invalid_invite" ? 404 : 409
      );
    }
    return mapAuthError(e);
  }
}
