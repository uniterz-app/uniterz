import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { listPastLockedSquadsForUser } from "@/lib/groupBattles/server/pastSquads";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";
import { GROUP_BATTLE_PAST_SQUAD_LIMIT } from "@/lib/groupBattles/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 直近 locked スクワッド履歴（再招集 UI） */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const pastSquads = await listPastLockedSquadsForUser(adminDb, uid);
    return jsonOk({
      pastSquads,
      limit: GROUP_BATTLE_PAST_SQUAD_LIMIT,
    });
  } catch (e) {
    return mapAuthError(e);
  }
}
