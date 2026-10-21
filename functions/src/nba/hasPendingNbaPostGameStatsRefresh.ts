import { getFirestore, Timestamp } from "firebase-admin/firestore";

/**
 * 試合後スタッツ監視が必要か（Firestore のみ・BDL は叩かない）。
 * Next `lib/nba/ingest/nbaPostGameStatsRefresh.ts` と同じ対象:
 * 直近 10 時間に開始して final のレギュラー / プレーオフで、`nbaPostGameStatsRefresh/{bdlGameId}.done` でないもの。
 */
export async function hasPendingNbaPostGameStatsRefresh(
  now = new Date()
): Promise<boolean> {
  const db = getFirestore();
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(now.getTime() - 10 * 60 * 60 * 1000))
    .where("startAtJst", "<=", Timestamp.fromMillis(now.getTime()))
    .get();
  const ids = snap.docs
    .map((d) => d.data() ?? {})
    .filter(
      (g) =>
        g.final === true &&
        (g.seasonPhase === "regular" || g.seasonPhase === "playoffs") &&
        typeof g.bdlGameId === "number"
    )
    .map((g) => String(g.bdlGameId));
  if (ids.length === 0) return false;
  const col = db.collection("nbaPostGameStatsRefresh");
  const states = await db.getAll(...ids.map((id) => col.doc(id)));
  return states.some((s) => s.get("done") !== true);
}
