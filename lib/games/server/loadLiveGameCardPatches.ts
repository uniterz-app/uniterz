/**
 * 開始済みの試合だけスコアを読む。窓クエリ（最大 200 件）は使わない。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  liveGameCardPatchFromGameDoc,
  type LiveGameCardPatch,
} from "@/lib/games/liveGameCardPatch";

const MAX_IDS = 24;

export async function loadLiveGameCardPatches(
  db: Firestore,
  ids: readonly string[]
): Promise<LiveGameCardPatch[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_IDS
  );
  if (unique.length === 0) return [];
  const snaps = await db.getAll(...unique.map((id) => db.collection("games").doc(id)));
  const patches: LiveGameCardPatch[] = [];
  snaps.forEach((snap, index) => {
    if (!snap.exists) return;
    const patch = liveGameCardPatchFromGameDoc(
      unique[index] ?? snap.id,
      snap.data() as Record<string, unknown>
    );
    if (patch) patches.push(patch);
  });
  return patches;
}
