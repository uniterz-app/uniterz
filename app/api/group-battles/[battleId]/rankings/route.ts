import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";
import {
  getBattle,
  parseSnapshotDoc,
  snapshotRef,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireUidFromRequest(req).catch(() => null);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);

    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ?? "weekly") as GroupBattlePeriod;
    if (period !== "weekly" && period !== "monthly") {
      return jsonErr("invalid_period", 400);
    }

    let label = url.searchParams.get("label") ?? "";
    if (!label) {
      label =
        period === "weekly"
          ? battle.weeklyLabels[battle.weeklyLabels.length - 1] ?? ""
          : battle.monthlyRange.label;
    }
    if (!label) return jsonErr("label_required", 400);

    const snap = await snapshotRef(adminDb, battleId, period, label).get();
    if (!snap.exists) {
      return jsonOk({
        battleId,
        period,
        label,
        snapshot: null,
      });
    }

    return jsonOk({
      battleId,
      period,
      label,
      snapshot: parseSnapshotDoc(
        snap.id,
        snap.data() as Record<string, unknown>
      ),
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
