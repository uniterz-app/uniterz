import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  getBattle,
  getCurrentBattle,
  getMembership,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import {
  entryProfileOrFallback,
  loadGroupBattleEntryProfiles,
} from "@/lib/groupBattles/server/loadEntryProfiles";
import { jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

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
    let mySquad: Record<string, unknown> | null = null;
    if (uid) {
      membership = await getMembership(adminDb, battle.id, uid);
      if (membership?.squadId) {
        const snap = await squadsCol(adminDb, battle.id)
          .doc(membership.squadId)
          .get();
        if (snap.exists) {
          const raw = snap.data() as Record<string, unknown>;
          const squad = parseSquadDoc(snap.id, raw);
          const profiles = await loadGroupBattleEntryProfiles(
            adminDb,
            squad.memberUids
          );
          const inviteCode =
            membership.role === "owner" &&
            typeof squad.inviteCodePlain === "string" &&
            squad.inviteCodePlain.trim()
              ? squad.inviteCodePlain.trim()
              : null;
          mySquad = {
            id: squad.id,
            name: squad.name,
            memberUids: squad.memberUids,
            memberCount: squad.memberCount,
            status: squad.status,
            ownerUid: squad.ownerUid,
            inviteCode,
            members: squad.memberUids.map((memberUid, i) =>
              entryProfileOrFallback(memberUid, profiles, i)
            ),
          };
        }
      }
    }

    return jsonOk({ battle, membership, mySquad });
  } catch (e) {
    return mapAuthError(e);
  }
}
