/**
 * Web 向けラッパ — 実体は `loadResultPostDetail`（Firestore 共用）。
 */
import { db } from "@/lib/firebase";
import {
  buildResultDetailViewFromLoad,
  buildWarmResultDetailViewFromPost,
  loadResultPostDetail,
  type LoadResultPostDetailResult,
  type ResultPostDetailMarket,
} from "@/lib/result/loadResultPostDetail";

export type { ResultPostDetailMarket };
export type LoadResultPostDetailClientResult = LoadResultPostDetailResult;

export {
  buildResultDetailViewFromLoad,
  buildWarmResultDetailViewFromPost,
};

export async function loadResultPostDetailClient(
  postId: string
): Promise<LoadResultPostDetailClientResult> {
  return loadResultPostDetail(postId, db);
}
