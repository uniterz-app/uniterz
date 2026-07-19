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
 * rankSnapshotHistory を全件 get せず、JST 日付を遡って doc を最大 maxDocs 件集める。
 * 逐次 get だと未作成日が多いユーザーで数十往復になり ECONNRESET しやすいため、
 * getAll で 1 往復にまとめる。
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

  const adminDb = getAdminDb();
  const keys = buildLookbackDateKeys(startKey, maxLookbackDays);
  if (keys.length === 0 || maxDocs <= 0) return [];

  const historyCol = adminDb
    .collection("cumulative_stats")
    .doc(uid)
    .collection(RANK_SNAPSHOT_HISTORY_SUBCOL);

  const refs = keys.map((key) => historyCol.doc(key));
  const snaps = await adminDb.getAll(...refs);

  const collected: RankSnapshotHistoryDoc[] = [];
  for (let i = 0; i < snaps.length; i++) {
    const snap = snaps[i];
    if (!snap?.exists) continue;
    collected.push({ id: keys[i]!, data: snap.data() ?? {} });
    if (collected.length >= maxDocs) break;
  }

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
