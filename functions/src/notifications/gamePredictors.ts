import type { Firestore } from "firebase-admin/firestore";

/**
 * 試合を予想した uid の一覧。`games/{id}` は公開読み取り＋毎分のライブ書き込みがあるため、
 * 増え続ける配列はここ（`gamePredictors/{gameId}.uids`）に置く。クライアントからは読めない。
 * 移行前の試合は `games.predictorUids` に残っているので、読むときは両方を合わせる。
 */
export const GAME_PREDICTORS_COLLECTION = "gamePredictors";

function addUids(out: Set<string>, uids: unknown): void {
  if (!Array.isArray(uids)) return;
  for (const raw of uids) {
    if (typeof raw === "string" && raw.trim()) out.add(raw.trim());
  }
}

export async function loadGamePredictorUids(
  firestore: Firestore,
  games: ReadonlyArray<{ id: string; data: FirebaseFirestore.DocumentData }>
): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  for (const game of games) {
    const set = new Set<string>();
    addUids(set, game.data.predictorUids);
    out.set(game.id, set);
  }
  const ids = [...out.keys()];
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const snaps = await firestore.getAll(
      ...chunk.map((id) => firestore.collection(GAME_PREDICTORS_COLLECTION).doc(id))
    );
    for (const snap of snaps) {
      if (!snap.exists) continue;
      addUids(out.get(snap.id)!, snap.data()?.uids);
    }
  }
  return out;
}
