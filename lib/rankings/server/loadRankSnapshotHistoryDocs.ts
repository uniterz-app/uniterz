import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { RANK_SNAPSHOT_HISTORY_SUBCOL } from "@/lib/rankings/rankingPhase";
import {
  dateKeyJST,
  getYesterdayDateKeyJST,
  RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
  subtractOneDayFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";

export type RankSnapshotHistoryDoc = {
  id: string;
  data: Record<string, unknown>;
};

/**
 * lookback 日付キーを新しい順に並べる（startKey から遡る）。
 */
function buildLookbackDateKeys(
  startKey: string,
  maxLookbackDays: number
): string[] {
  const keys: string[] = [];
  let key = startKey;
  for (let i = 0; i < maxLookbackDays; i++) {
    keys.push(key);
    key = subtractOneDayFromDateKeyJST(key);
  }
  return keys;
}

/**
 * rankSnapshotHistory を全件 get せず、存在する最新 doc を最大 maxDocs 件だけ読む。
 * 以前の「lookback 日数ぶん getAll」は未作成日も課金対象だったため、query + limit に変更。
 */
export async function loadRankSnapshotHistoryDocsWalkBack(
  uid: string,
  options?: {
    maxDocs?: number;
    maxLookbackDays?: number;
    /** 省略時は今日（JST）。前日比 prior だけ欲しいときは昨日を渡す */
    startDateKey?: string;
  }
): Promise<RankSnapshotHistoryDoc[]> {
  const maxDocs = options?.maxDocs ?? 2;
  const maxLookbackDays =
    options?.maxLookbackDays ?? RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS;
  const startKey = options?.startDateKey ?? dateKeyJST();

  if (maxDocs <= 0 || maxLookbackDays <= 0) return [];

  const lookbackKeys = buildLookbackDateKeys(startKey, maxLookbackDays);
  const minKey = lookbackKeys[lookbackKeys.length - 1]!;

  const adminDb = getAdminDb();
  const historyCol = adminDb
    .collection("cumulative_stats")
    .doc(uid)
    .collection(RANK_SNAPSHOT_HISTORY_SUBCOL);

  const snap = await historyCol
    .where(FieldPath.documentId(), ">=", minKey)
    .where(FieldPath.documentId(), "<=", startKey)
    .orderBy(FieldPath.documentId(), "desc")
    .limit(maxDocs)
    .get();

  const collected: RankSnapshotHistoryDoc[] = snap.docs.map((d) => ({
    id: d.id,
    data: (d.data() as Record<string, unknown>) ?? {},
  }));

  return collected.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * 昨日以前で最も新しい rankSnapshotHistory 1 件（前日比用）。
 */
export async function loadMostRecentPriorRankSnapshotHistory(
  uid: string,
  options?: { maxLookbackDays?: number }
): Promise<RankSnapshotHistoryDoc | null> {
  const docs = await loadRankSnapshotHistoryDocsWalkBack(uid, {
    maxDocs: 1,
    maxLookbackDays:
      options?.maxLookbackDays ?? RANK_DELTA_PRIOR_MAX_LOOKBACK_DAYS,
    startDateKey: getYesterdayDateKeyJST(),
  });
  return docs[0] ?? null;
}
