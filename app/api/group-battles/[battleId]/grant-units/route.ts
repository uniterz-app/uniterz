import { adminDb } from "@/lib/firebaseAdmin";
import { grantGroupBattleUnitsForSnapshot } from "@/lib/groupBattles/server/grantUnits";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";
import { jsonErr, jsonOk } from "@/lib/groupBattles/server/http";
import { checkJobSecret } from "@/lib/security/assertJobSecret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

/**
 * final スナップショットに対する Unit 冪等付与（運営/ジョブ）。
 */
export async function POST(req: Request, ctx: Ctx) {
  if (!checkJobSecret(req)) {
    return jsonErr("forbidden", 403);
  }

  const { battleId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const period = body?.period as GroupBattlePeriod;
  const label = String(body?.label ?? "");
  if (period !== "weekly" && period !== "monthly") {
    return jsonErr("invalid_period", 400);
  }
  if (!label) return jsonErr("label_required", 400);

  const result = await grantGroupBattleUnitsForSnapshot(adminDb, {
    battleId,
    period,
    label,
  });
  return jsonOk(result);
}
