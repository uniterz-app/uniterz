import { adminDb } from "@/lib/firebaseAdmin";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { buildAllActiveGroupBattleSnapshots } from "@/lib/groupBattles/server/buildPeriodSnapshot";
import { jsonErr, jsonOk } from "@/lib/groupBattles/server/http";
import { checkJobSecret } from "@/lib/security/assertJobSecret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * グループバトル期間スナップショット再構築（運営/ジョブ）。
 * ヘッダ `x-internal-job-secret` または `x-group-battle-admin-secret`。
 */
export async function POST(req: Request) {
  if (!checkJobSecret(req)) {
    return jsonErr("forbidden", 403);
  }

  const todayKey = dateKeyJST(new Date());
  const built = await buildAllActiveGroupBattleSnapshots(adminDb, todayKey);
  return jsonOk({ built, todayKey });
}
