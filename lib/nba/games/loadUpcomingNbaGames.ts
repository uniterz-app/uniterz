import { Timestamp, type Firestore } from "firebase-admin/firestore";

export async function loadUpcomingNbaGames(
  db: Firestore,
  opts: { fromMs: number; toMs: number; limit: number }
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("startAtJst", ">=", Timestamp.fromMillis(opts.fromMs))
    .where("startAtJst", "<=", Timestamp.fromMillis(opts.toMs))
    .orderBy("startAtJst", "asc")
    .limit(opts.limit)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    data: d.data() as Record<string, unknown>,
  }));
}
