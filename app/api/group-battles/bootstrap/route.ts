import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { loadGroupBattleBootstrap } from "@/lib/groupBattles/server/loadBattleBootstrap";
import { jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req).catch(() => null);
    const url = new URL(req.url);
    const battleId = url.searchParams.get("battleId");
    const period = (url.searchParams.get("period") ??
      "weekly") as GroupBattlePeriod;
    const label = url.searchParams.get("label");

    const payload = await loadGroupBattleBootstrap(adminDb, uid, {
      battleId,
      period: period === "monthly" ? "monthly" : "weekly",
      label,
      weekIndex: Number(url.searchParams.get("week") || "") || null,
    });

    return jsonOk({
      battle: payload.battle,
      membership: payload.membership,
      mySquad: payload.mySquad,
      rankings: payload.rankings,
      openSquads: payload.openSquads,
      pastSquads: payload.pastSquads,
      invites: payload.invites,
      joinRequests: payload.joinRequests,
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
