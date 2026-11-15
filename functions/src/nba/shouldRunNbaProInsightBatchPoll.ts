import { getFirestore } from "firebase-admin/firestore";

/**
 * batch_poll を Vercel に投げる前のゲート。
 * pending の OpenAI Batch が無いときは Next を起こさない。
 */
export async function shouldRunNbaProInsightBatchPoll(): Promise<boolean> {
  const snap = await getFirestore()
    .collection("nbaProInsightBatches")
    .where("pending", "==", true)
    .limit(1)
    .select("pending")
    .get();
  return !snap.empty;
}
