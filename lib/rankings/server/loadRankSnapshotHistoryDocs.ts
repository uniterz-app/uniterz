import { getAdminDb } from "@/lib/firebaseAdmin";
import { RANK_SNAPSHOT_HISTORY_SUBCOL } from "@/lib/rankings/rankingPhase";
import {
  dateKeyJST,
  RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
  subtractOneDayFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";

export type RankSnapshotHistoryDoc = {
  id: string;
  data: Record<string, unknown>;
};

/**
 * rankSnapshotHistory を全件 get せず、JST 日付を遡って doc を最大 maxDocs 件集める。
 */
export async function loadRankSnapshotHistoryDocsWalkBack(
  uid: string,
  options?: {
    maxDocs?: number;
    maxLookbackDays?: number;
  }
): Promise<RankSnapshotHistoryDoc[]> {
  const maxDocs = options?.maxDocs ?? 2;
  const maxLookbackDays =
    options?.maxLookbackDays ?? RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS;

  const adminDb = getAdminDb();
  const collected: RankSnapshotHistoryDoc[] = [];
  let key = dateKeyJST();

  for (let i = 0; i < maxLookbackDays; i++) {
    const snap = await adminDb
      .collection("cumulative_stats")
      .doc(uid)
      .collection(RANK_SNAPSHOT_HISTORY_SUBCOL)
      .doc(key)
      .get();

    if (snap.exists) {
      collected.push({ id: key, data: snap.data() ?? {} });
    }

    if (collected.length >= maxDocs) break;
    key = subtractOneDayFromDateKeyJST(key);
  }

  return collected.sort((a, b) => a.id.localeCompare(b.id));
}
