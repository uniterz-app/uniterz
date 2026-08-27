import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { GROUP_BATTLE_MAX_MEMBERS } from "@/lib/groupBattles/constants";
import {
  getBattle,
  parseSquadDoc,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";
import {
  entryProfileOrFallback,
  loadGroupBattleEntryProfiles,
} from "@/lib/groupBattles/server/loadEntryProfiles";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    // メンバーの uid / handle / plan を返すため認証必須（未ログインには出さない）
    await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    const battle = await getBattle(adminDb, battleId);
    if (!battle) return jsonErr("not_found", 404);

    const snap = await squadsCol(adminDb, battleId)
      .where("status", "in", ["forming", "entered"])
      .limit(80)
      .get();

    const parsed = snap.docs
      .map((d) => parseSquadDoc(d.id, d.data() as Record<string, unknown>))
      .filter((s) => s.memberCount < GROUP_BATTLE_MAX_MEMBERS);

    const allUids = [
      ...new Set(parsed.flatMap((s) => s.memberUids.filter(Boolean))),
    ];
    const profiles = await loadGroupBattleEntryProfiles(adminDb, allUids);

    const open = parsed.map((s) => ({
      id: s.id,
      name: s.name,
      memberCount: s.memberCount,
      openSlots: GROUP_BATTLE_MAX_MEMBERS - s.memberCount,
      status: s.status,
      memberUids: s.memberUids,
      members: s.memberUids.map((uid, i) =>
        entryProfileOrFallback(uid, profiles, i)
      ),
    }));

    return jsonOk({ squads: open });
  } catch (e) {
    return mapAuthError(e);
  }
}
