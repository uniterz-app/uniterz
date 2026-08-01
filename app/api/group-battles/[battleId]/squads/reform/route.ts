import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  assertRecruitingOrThrow,
  getBattle,
} from "@/lib/groupBattles/server/firestore";
import { reformSquadFromPast } from "@/lib/groupBattles/server/reform";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

/** 過去スクワッドから下書き作成＋一括招待（当時 owner のみ） */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);
    assertRecruitingOrThrow(battle.phase);

    const body = await req.json().catch(() => ({}));
    const sourceBattleId = String(body?.sourceBattleId ?? "").trim();
    const sourceSquadId = String(body?.sourceSquadId ?? "").trim();
    if (!sourceBattleId || !sourceSquadId) {
      return jsonErr("invalid_source", 400);
    }

    const result = await reformSquadFromPast({
      db: adminDb,
      battleId,
      uid,
      sourceBattleId,
      sourceSquadId,
      nameRaw: body?.name,
    });

    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "already_in_squad") return jsonErr("already_in_squad", 409);
    if (msg === "owner_required") return jsonErr("owner_required", 403);
    if (msg === "not_past_member") return jsonErr("not_past_member", 403);
    if (msg === "source_not_found") return jsonErr("source_not_found", 404);
    if (msg === "source_not_locked") return jsonErr("source_not_locked", 400);
    if (msg === "invalid_name") return jsonErr("invalid_name", 400);
    if (msg === "invite_code_exhausted") {
      return jsonErr("invite_code_exhausted", 500);
    }
    return mapAuthError(e);
  }
}
