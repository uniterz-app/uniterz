import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  GROUP_BATTLE_INVITE_MAX_PER_TARGET,
  GROUP_BATTLE_MAX_MEMBERS,
} from "@/lib/groupBattles/constants";
import {
  assertRecruitingOrThrow,
  getBattle,
  getMembership,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { createSquadInvite } from "@/lib/groupBattles/server/invites";
import { loadSourcePastSquad } from "@/lib/groupBattles/server/pastSquads";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string; squadId: string }> };

/**
 * 個別招待。owner のみ。
 * 任意で sourceBattleId/sourceSquadId を付け、過去メンバーであることも検証可。
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId, squadId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    assertRecruitingOrThrow(battle.phase);

    const membership = await getMembership(adminDb, battleId, uid);
    if (!membership || membership.squadId !== squadId) {
      return jsonErr("forbidden", 403);
    }
    if (membership.role !== "owner") return jsonErr("owner_required", 403);

    const squadSnap = await squadsCol(adminDb, battleId).doc(squadId).get();
    if (!squadSnap.exists) return jsonErr("squad_not_found", 404);
    const squad = parseSquadDoc(
      squadSnap.id,
      squadSnap.data() as Record<string, unknown>
    );
    if (squad.memberCount >= GROUP_BATTLE_MAX_MEMBERS) {
      return jsonErr("squad_full", 409);
    }

    const body = await req.json().catch(() => ({}));
    const targetUid = String(body?.targetUid ?? "").trim();
    if (!targetUid) return jsonErr("invalid_target", 400);

    const sourceBattleId = String(body?.sourceBattleId ?? "").trim();
    const sourceSquadId = String(body?.sourceSquadId ?? "").trim();
    if (sourceBattleId && sourceSquadId) {
      const source = await loadSourcePastSquad(
        adminDb,
        uid,
        sourceBattleId,
        sourceSquadId
      );
      if (!source.ok) return jsonErr(source.reason, 400);
      if (!source.memberUids.includes(targetUid)) {
        return jsonErr("not_past_member", 400);
      }
    }

    const result = await createSquadInvite({
      db: adminDb,
      battleId,
      squadId,
      fromUid: uid,
      toUid: targetUid,
      source: "manual",
      sourceBattleId: sourceBattleId || null,
      sourceSquadId: sourceSquadId || null,
    });

    if (result.status === "skipped") {
      const status =
        result.reason === "invite_limit"
          ? 429
          : result.reason === "already_in_squad" ||
              result.reason === "already_pending"
            ? 409
            : 400;
      return jsonErr(result.reason, status, {
        maxPerTarget: GROUP_BATTLE_INVITE_MAX_PER_TARGET,
      });
    }

    return jsonOk({ inviteId: result.inviteId });
  } catch (e) {
    return mapAuthError(e);
  }
}
