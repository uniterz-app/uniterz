/**
 * 期間内・asOf までの tip-off がある NBA ピックアップ試合数（勝率 65% ガード用）。
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { isNbaPickupGame } from "@/lib/nba/isPickupGame";

function jstDayStart(dateKey: string): Timestamp {
  return Timestamp.fromDate(new Date(`${dateKey}T00:00:00+09:00`));
}

function jstDayEnd(dateKey: string): Timestamp {
  return Timestamp.fromDate(new Date(`${dateKey}T23:59:59.999+09:00`));
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
    .where("startAtJst", ">=", jstDayStart(opts.startKey))
    .where("startAtJst", "<=", jstDayEnd(opts.asOfKey))
    .get();

  let n = 0;
  for (const doc of snap.docs) {
    if (isNbaPickupGame(doc.data())) n += 1;
  }
  return n;
}
