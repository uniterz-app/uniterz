import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { applyPostToUserStatsV2 } from "../updateUserStatsV2";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const onPostCreatedV2 = onDocumentCreated("posts/{postId}", async (event) => {
  const post = event.data?.data() as any;
  if (!post) return;

  // ✅ v2のみ対象
  if (post.schemaVersion !== 2) return;
  if (!post.authorUid) return;

  // 👉 集計は onGameFinalV2 側でやるので、ここでは何もしない
});
