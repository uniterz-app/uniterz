import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  getBattle,
  getCurrentBattle,
  getMembership,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req).catch(() => null);
    const url = new URL(req.url);
    const battleId = url.searchParams.get("battleId");

    const battle = battleId
      ? await getBattle(adminDb, battleId)
      : await getCurrentBattle(adminDb);

    if (!battle) {
      return jsonOk({ battle: null, membership: null, mySquad: null });
    }

    let membership: { squadId: string; role: "owner" | "member" } | null = null;
    let mySquad: ReturnType<typeof parseSquadDoc> | null = null;
    if (uid) {
      membership = await getMembership(adminDb, battle.id, uid);
      if (membership?.squadId) {
        const snap = await squadsCol(adminDb, battle.id)
          .doc(membership.squadId)
          .get();
        if (snap.exists) {
          mySquad = parseSquadDoc(
            snap.id,
            snap.data() as Record<string, unknown>
          );
        }
      }
    }

    return jsonOk({ battle, membership, mySquad });
  } catch (e) {
    return mapAuthError(e);
  }
}
