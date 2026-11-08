import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getMembership } from "@/lib/groupBattles/server/firestore";
import { loadMySquadForViewer } from "@/lib/groupBattles/server/loadBattleBootstrap";
import { loadGroupBattleSharedView } from "@/lib/groupBattles/server/sharedViewCache";
import { jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req).catch(() => null);
    const url = new URL(req.url);
    const battleId = url.searchParams.get("battleId");

    const shared = await loadGroupBattleSharedView(adminDb, { battleId });
    const battle = shared.battle;

    if (!battle) {
      return jsonOk({ battle: null, membership: null, mySquad: null });
    }

    let membership: { squadId: string; role: "owner" | "member" } | null = null;
    let mySquad: Record<string, unknown> | null = null;
    if (uid) {
      membership = await getMembership(adminDb, battle.id, uid);
      if (membership?.squadId) {
        mySquad = await loadMySquadForViewer(
          adminDb,
          shared,
          battle.id,
          membership
        );
      }
    }

    return jsonOk({ battle, membership, mySquad });
  } catch (e) {
    return mapAuthError(e);
  }
}
