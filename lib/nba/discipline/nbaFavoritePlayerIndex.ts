/**
 * Firestore `nbaFavoritePlayerIndex/all` — 誰かがお気に入りにした選手 ID の和集合。
 * 試合中の規律通知で「お気に入り選手が出ている試合だけ」play-by-play を取るための 1 doc。
 * 外したときに消さない（残っても余分に 1 試合取るだけ）。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";

const INDEX_COLLECTION = "nbaFavoritePlayerIndex";
const INDEX_DOC = "all";

export async function addNbaFavoritePlayerIdsToIndex(
  db: Firestore,
  playerIds: readonly string[]
): Promise<void> {
  const ids = playerIds.filter(Boolean);
  if (ids.length === 0) return;
  await db
    .collection(INDEX_COLLECTION)
    .doc(INDEX_DOC)
    .set({ playerIds: FieldValue.arrayUnion(...ids) }, { merge: true });
}

export async function loadNbaFavoritePlayerIdIndex(db: Firestore): Promise<Set<string>> {
  const snap = await db.collection(INDEX_COLLECTION).doc(INDEX_DOC).get();
  const ids = snap.get("playerIds");
  return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : []);
}
