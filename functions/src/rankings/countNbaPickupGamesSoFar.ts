/**
 * 期間内・asOf までの tip-off がある NBA ピックアップ試合数（勝率 65% ガード用）。
 * パターン B: 分母は「その時点まで」の pickup。
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { isNbaPickupGame } from "./isPickupGame";

function jstDayStart(dateKey: string): Timestamp {
  return Timestamp.fromDate(new Date(`${dateKey}T00:00:00+09:00`));
}

function jstDayEnd(dateKey: string): Timestamp {
  return Timestamp.fromDate(new Date(`${dateKey}T23:59:59.999+09:00`));
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
    .where("startAtJst", ">=", jstDayStart(opts.startKey))
    .where("startAtJst", "<=", jstDayEnd(opts.asOfKey))
    .get();

  let n = 0;
  for (const doc of snap.docs) {
    if (isNbaPickupGame(doc.data())) n += 1;
  }
  return n;
}
