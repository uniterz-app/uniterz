/**
 * 投稿の作成・勝者変更・削除で、先週 TOP 5% の人だけ `nbaSmartMoneyMarkets/{gameId}` を増減する。
 * 公開市場（games.marketPickCounts）と同じトランザクションの中で使う。
 * Firestore のトランザクションは読みが先なので、prepare（読み）→ 返り値の関数（書き）の 2 段。
 */
import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import {
  addDaysToDateKey,
  rankingPeriodWeekStartKey,
} from "@/lib/rankings/rankingPeriodClock";
import type { LiveMarketCounts, LiveMarketSide } from "./liveGameMarket";
import {
  SMART_MONEY_COHORT_COLLECTION,
  SMART_MONEY_MARKETS_COLLECTION,
} from "./smartMoneyMarket";

/** いま有効なコホートの週（先週の Eastern 月曜） */
export function smartMoneyCohortWeekLabel(now: Date = new Date()): string {
  return addDaysToDateKey(rankingPeriodWeekStartKey(now), -7);
}

export type SmartMoneyChange = {
  from?: LiveMarketSide | null;
  to?: LiveMarketSide | null;
};

function nonNegInt(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

/**
 * 投稿者が今週のコホートにいなければ null（書かない）。
 * 市場 doc の週が違うときも触らない（日次の数え直しに任せる）。
 */
export async function prepareSmartMoneyDelta(
  tx: Transaction,
  db: Firestore,
  opts: { uid: string; gameId: string; now?: Date }
): Promise<((change: SmartMoneyChange) => void) | null> {
  const weekLabel = smartMoneyCohortWeekLabel(opts.now);
  const memberRef = db
    .collection(SMART_MONEY_COHORT_COLLECTION)
    .doc(weekLabel)
    .collection("members")
    .doc(opts.uid);
  const marketRef = db.collection(SMART_MONEY_MARKETS_COLLECTION).doc(opts.gameId);
  const [memberSnap, marketSnap] = await Promise.all([
    tx.get(memberRef),
    tx.get(marketRef),
  ]);
  if (!memberSnap.exists) return null;
  const market = marketSnap.exists ? (marketSnap.data() ?? {}) : null;
  if (market && market.weekLabel !== weekLabel) return null;

  const pick =
    market?.pickCounts && typeof market.pickCounts === "object"
      ? (market.pickCounts as Record<string, unknown>)
      : {};
  const counts: LiveMarketCounts = {
    home: nonNegInt(pick.home),
    away: nonNegInt(pick.away),
    draw: nonNegInt(pick.draw),
  };
  const cohortSize = nonNegInt(memberSnap.data()?.cohortSize);

  return (change) => {
    if (change.from === change.to) return;
    // doc が無いのに減らす変更は数え直しに任せる
    if (!market && !change.to) return;
    if (change.from) counts[change.from] = Math.max(0, counts[change.from] - 1);
    if (change.to) counts[change.to] += 1;
    tx.set(
      marketRef,
      {
        gameId: opts.gameId,
        weekLabel,
        pickCounts: counts,
        predictorCount: counts.home + counts.away + counts.draw,
        ...(cohortSize > 0 ? { cohortSize } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  };
}
