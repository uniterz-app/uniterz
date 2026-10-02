/**
 * 期間内・asOf までの tip-off がある NBA ピックアップ試合数（勝率 65% ガード用）。
 * dateKey は US Eastern 暦日（ランキング期間と同一）。
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { isNbaPickupGame } from "@/lib/nba/isPickupGame";
import {
  addDaysToDateKey,
  rankingPeriodDayBoundsUtc,
} from "@/lib/rankings/rankingPeriodClock";

function etDayStart(dateKey: string): Timestamp {
  return Timestamp.fromDate(rankingPeriodDayBoundsUtc(dateKey).start);
}

function etDayEndInclusive(dateKey: string): Timestamp {
  const next = addDaysToDateKey(dateKey, 1);
  const nextStart = rankingPeriodDayBoundsUtc(next).start;
  return Timestamp.fromMillis(nextStart.getTime() - 1);
}

export async function countNbaPickupGamesSoFarAdmin(opts: {
  db: Firestore;
  startKey: string;
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
