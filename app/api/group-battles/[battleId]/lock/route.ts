/**
 * 募集締切後のメンバーロック（運営/ジョブ用）。
 * ヘッダ `x-internal-job-secret` または `x-group-battle-admin-secret`。
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  battleRef,
  getBattle,
  lockEligibleSquads,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk } from "@/lib/groupBattles/server/http";
import { checkJobSecret } from "@/lib/security/assertJobSecret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  if (!checkJobSecret(req)) {
    return jsonErr("forbidden", 403);
  }

  const { battleId } = await ctx.params;
  const battle = await getBattle(adminDb, battleId);
  if (!battle) return jsonErr("not_found", 404);

  if (battle.phase !== "recruiting" && battle.phase !== "locking") {
    return jsonErr("invalid_phase", 409, { phase: battle.phase });
  }

  await battleRef(adminDb, battleId).update({
    phase: "locking",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const result = await lockEligibleSquads(adminDb, battleId);
  return jsonOk(result);
}
