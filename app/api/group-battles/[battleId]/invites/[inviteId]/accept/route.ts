import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  assertRecruitingOrThrow,
  getBattle,
} from "@/lib/groupBattles/server/firestore";
import { acceptSquadInvite } from "@/lib/groupBattles/server/invites";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string; inviteId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId, inviteId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    assertRecruitingOrThrow(battle.phase);

    await acceptSquadInvite({ db: adminDb, battleId, inviteId, uid });
    return jsonOk({ decision: "accepted" as const });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "invite_not_found") return jsonErr("invite_not_found", 404);
    if (msg === "forbidden") return jsonErr("forbidden", 403);
    if (msg === "not_pending") return jsonErr("not_pending", 409);
    if (msg === "already_in_squad") return jsonErr("already_in_squad", 409);
    if (msg === "squad_full") return jsonErr("squad_full", 409);
    if (msg === "squad_not_found") return jsonErr("squad_not_found", 404);
    if (msg === "squad_not_open") return jsonErr("squad_not_open", 409);
    return mapAuthError(e);
  }
}
