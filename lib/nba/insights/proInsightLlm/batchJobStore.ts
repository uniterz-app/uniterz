/**
 * OpenAI Batch ジョブ状態（Firestore `nbaProInsightBatches/{id}`）。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const NBA_PRO_INSIGHT_BATCHES_COLLECTION = "nbaProInsightBatches";

export type ProInsightBatchJobDoc = {
  openaiBatchId: string | null;
  status:
    | "dry_run"
    | "submitted"
    | "validating"
    | "in_progress"
    | "finalizing"
    | "completed"
    | "failed"
    | "expired"
    | "cancelled";
  /** true while OpenAI batch not finished — poll query 用 */
  pending: boolean;
  model: string;
  seasonKey: string;
  gameIds: string[];
  /** custom_id → gameId（通常は同一） */
  customIds: string[];
  inputFileId?: string | null;
  outputFileId?: string | null;
  error?: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  completedAtMs?: number | null;
  writtenGameIds?: string[];
};

export async function saveProInsightBatchJob(
  db: Firestore,
  docId: string,
  data: ProInsightBatchJobDoc
): Promise<void> {
  await db
    .collection(NBA_PRO_INSIGHT_BATCHES_COLLECTION)
    .doc(docId)
    .set(
      {
        ...data,
        pending:
          data.pending ??
          ["submitted", "validating", "in_progress", "finalizing"].includes(
            data.status
          ),
        updatedAtMs: data.updatedAtMs,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function listPendingProInsightBatchJobs(
  db: Firestore,
  limit = 20
): Promise<Array<{ id: string; data: ProInsightBatchJobDoc }>> {
  const snap = await db
    .collection(NBA_PRO_INSIGHT_BATCHES_COLLECTION)
    .where("pending", "==", true)
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    data: d.data() as ProInsightBatchJobDoc,
  }));
}
