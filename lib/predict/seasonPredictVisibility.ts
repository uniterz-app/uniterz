/**
 * シーズン予想（アワード / 順位）を「他人に見せてよいか」の判定。サーバー専用（Admin SDK）。
 *
 * ルール:
 * - 本人は常に見える。
 * - 他人には、提出締切を過ぎるまで何も返さない（締切前の丸写し防止）。
 * - 締切後は公開。ただし本人が設定で「非公開」にしていれば返さない。
 *
 * 「非公開」フラグは users/{uid}/private/displayPrefs の `seasonPredictHidden`（本人だけ読み書き）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { USER_PRIVATE_DISPLAY_PREFS_DOC } from "@/lib/user/userPrivatePaths";
import { seasonPredictSubmitClosedForSeason } from "@/lib/predict/seasonPredictDeadline";

export const SEASON_PREDICT_HIDDEN_FIELD = "seasonPredictHidden";

export type SeasonPredictHiddenReason = "before_deadline" | "private";

/** Authorization ヘッダーが正しければ uid、無ければ null（閲覧は未ログインでも可） */
export async function optionalUidFromRequest(req: Request): Promise<string | null> {
  const authz = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7).trim() : "";
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function readSeasonPredictHiddenByOwner(db: Firestore, uid: string): Promise<boolean> {
  const snap = await db
    .doc(`users/${uid}/private/${USER_PRIVATE_DISPLAY_PREFS_DOC}`)
    .get();
  return snap.data()?.[SEASON_PREDICT_HIDDEN_FIELD] === true;
}

/**
 * 他人（閲覧者 ≠ 持ち主）に予想を返してよいか。返せないなら理由を返す。
 * 締切前は持ち主の設定を読まない（読み取りを減らす）。
 */
export async function seasonPredictHiddenFromViewer(input: {
  db: Firestore;
  ownerUid: string;
  season: string;
  viewerUid: string | null;
}): Promise<SeasonPredictHiddenReason | null> {
  if (input.viewerUid && input.viewerUid === input.ownerUid) return null;
  if (!seasonPredictSubmitClosedForSeason(input.season)) return "before_deadline";
  if (await readSeasonPredictHiddenByOwner(input.db, input.ownerUid)) return "private";
  return null;
}
