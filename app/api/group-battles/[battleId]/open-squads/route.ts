import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { loadGroupBattleSharedView } from "@/lib/groupBattles/server/sharedViewCache";
import { jsonErr, jsonOk, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ battleId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    // メンバーの uid / handle / plan を返すため認証必須（未ログインには出さない）
    await requireUidFromRequest(req);
    const { battleId } = await ctx.params;
    // 募集中スクワッドは全員同じ。スクワッドを変える API がキャッシュを捨てる
    const shared = await loadGroupBattleSharedView(adminDb, { battleId });
    if (!shared.battle) return jsonErr("not_found", 404);
    return jsonOk({ squads: shared.openSquads });
  } catch (e) {
    return mapAuthError(e);
  }
}
