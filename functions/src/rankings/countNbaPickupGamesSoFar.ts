/**
 * 期間内・asOf までの tip-off がある NBA ピックアップ試合数（勝率 65% ガード用）。
 * パターン B: 分母は「その時点まで」の pickup。
 * dateKey は US Eastern 暦日（ランキング期間と同一）。
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { isNbaPickupGame } from "./isPickupGame";
import {
  addDaysToDateKey,
  rankingPeriodDayBoundsUtc,
} from "./nbaPeriod";

function etDayStart(dateKey: string): Timestamp {
  return Timestamp.fromDate(rankingPeriodDayBoundsUtc(dateKey).start);
}

function etDayEndInclusive(dateKey: string): Timestamp {
  const nextStart = rankingPeriodDayBoundsUtc(
    addDaysToDateKey(dateKey, 1)
  ).start;
  return Timestamp.fromMillis(nextStart.getTime() - 1);
}

export async function countNbaPickupGamesSoFar(opts: {
  db: Firestore;
  startKey: string;
  /** tip-off 上限（通常 min(todayKey, periodEndKey)） */
  asOfKey: string;
}): Promise<number> {
  if (opts.asOfKey < opts.startKey) return 0;

  const snap = await opts.db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", etDayStart(opts.startKey))
    .where("startAtJst", "<=", etDayEndInclusive(opts.asOfKey))
    .get();

  let n = 0;
  for (const doc of snap.docs) {
    if (isNbaPickupGame(doc.data())) n += 1;
  }
  return n;
}
