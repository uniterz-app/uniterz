/**
 * Native 向けラッパ — 実体は `loadResultPostDetail`（Firestore 共用）。
 */
import { db } from "../../lib/firebase";
import {
  buildResultDetailViewFromLoad,
  buildWarmResultDetailViewFromPost,
  loadResultPostDetail,
  type LoadResultPostDetailResult,
  type ResultPostDetailMarket,
} from "../../../../../lib/result/loadResultPostDetail";

export type { ResultPostDetailMarket };
export type ResultDetailPost = Record<string, unknown> & { id: string };
export type LoadResultPostDetailNativeResult = LoadResultPostDetailResult;

export {
  buildResultDetailViewFromLoad,
  buildWarmResultDetailViewFromPost,
};

/** Web `loadResultPostDetailClient` と同じ手順 */
export async function loadResultPostDetailNative(
  postId: string
): Promise<LoadResultPostDetailNativeResult> {
  return loadResultPostDetail(postId, db);
}
