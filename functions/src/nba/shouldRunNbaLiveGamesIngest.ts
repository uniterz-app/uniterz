import { getFirestore, Timestamp } from "firebase-admin/firestore";

/**
 * ライブ同期が必要な NBA 試合があるか（Firestore のみ・BDL は叩かない）。
 *
 * true になる条件:
 * - status === "live"
 * - tip-off が [now - 4h, now + 20min] にあり、まだ final でない
 *
 * 試合のない日・全試合終了後・tip まで遠い時間帯は false → cron は Next/BDL を呼ばない。
 */
export async function shouldRunNbaLiveGamesIngest(
  now = new Date()
): Promise<boolean> {
  const db = getFirestore();
  const windowStart = Timestamp.fromMillis(now.getTime() - 4 * 60 * 60 * 1000);
  const windowEnd = Timestamp.fromMillis(now.getTime() + 20 * 60 * 1000);

  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", windowStart)
    .where("startAtJst", "<=", windowEnd)
    .limit(40)
    .get();

  if (snap.empty) return false;

  return snap.docs.some((doc) => {
    const status = String(doc.data()?.status ?? "").toLowerCase();
    if (status === "live") return true;
    if (status === "final" || status === "ended") return false;
    return true;
  });
}
