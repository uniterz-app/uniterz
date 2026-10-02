import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { setGroupBattlePhase } from "@/lib/groupBattles/server/setPhase";
import type { GroupBattlePhase } from "@/lib/groupBattles/types";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

const PHASES: GroupBattlePhase[] = [
  "announced",
  "recruiting",
  "locking",
  "battle",
  "settling",
  "final",
  "closed",
];

/** フェーズ進行。recruiting→battle はロック処理込み */
export async function POST(req: Request, ctx: Ctx) {
  try {
    await requireAdminUid(req);
    const { battleId } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const phase = String(body?.phase ?? "").trim() as GroupBattlePhase;
    if (!PHASES.includes(phase)) {
      return jsonErr("invalid_phase", 400);
    }
    const result = await setGroupBattlePhase(adminDb, battleId, phase);
    if (!result.ok) {
      return jsonErr(result.error, result.status ?? 400);
    }
    return jsonOk({
      battleId,
      phase: result.phase,
      lock: result.lock ?? null,
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
