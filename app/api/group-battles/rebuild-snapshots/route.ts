import { adminDb } from "@/lib/firebaseAdmin";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { buildAllActiveGroupBattleSnapshots } from "@/lib/groupBattles/server/buildPeriodSnapshot";
import { jsonErr, jsonOk } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * グループバトル期間スナップショット再構築（運営/ジョブ）。
 * ヘッダ `x-group-battle-admin-secret` 必須。
 */
export async function POST(req: Request) {
  const secret = process.env.GROUP_BATTLE_ADMIN_SECRET?.trim();
  const header = req.headers.get("x-group-battle-admin-secret")?.trim();
  if (!secret || !header || header !== secret) {
    return jsonErr("forbidden", 403);
  }

  const todayKey = dateKeyJST(new Date());
  const built = await buildAllActiveGroupBattleSnapshots(adminDb, todayKey);
  return jsonOk({ built, todayKey });
}
