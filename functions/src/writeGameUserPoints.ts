/**
 * 試合ごとのユーザー確定ポイント小計 `gameUserPoints/{gameId}`。
 * TODAY UNITERZ（その日の合計 Top20）は、その日の試合の小計を足すだけで posts を読み直さない。
 * 日付はユーザー TZ ごとに違うため、日単位ではなく試合単位で持つ。
 */
import { FieldValue } from "firebase-admin/firestore";
import type { PostSettlementComputed } from "./computePostSettlement";
import { isNbaPickupGame } from "./rankings/isPickupGame";

/** e.k ビット: 1 = countedForRanking（PRO LEAGUE）, 2 = countedForPickup（PICK UP） */
export const GAME_USER_POINTS_RANKING = 1;
export const GAME_USER_POINTS_PICKUP = 2;

export async function writeGameUserPoints(params: {
  db: FirebaseFirestore.Firestore;
  gameId: string;
  game: { league?: unknown; countsForRanking?: unknown; isPickup?: unknown; pickupWeekKey?: unknown };
  postsSnap: FirebaseFirestore.QuerySnapshot;
  settlementByPostId: Map<string, PostSettlementComputed>;
}): Promise<void> {
  const { db, gameId, game, postsSnap, settlementByPostId } = params;
  if (String(game.league ?? "").toLowerCase() !== "nba") return;

  const countsForRanking = game.countsForRanking !== false;
  const k =
    (countsForRanking ? GAME_USER_POINTS_RANKING : 0) |
    (countsForRanking && isNbaPickupGame(game) ? GAME_USER_POINTS_PICKUP : 0);

  const entries: Array<{ u: string; p: number; k: number }> = [];
  for (const doc of postsSnap.docs) {
    const d = doc.data();
    const uid = typeof d.authorUid === "string" ? d.authorUid : "";
    if (!uid) continue;
    const points =
      settlementByPostId.get(doc.id)?.totalPoints ?? Number(d.stats?.pointsV3);
    if (!Number.isFinite(points)) continue;
    entries.push({ u: uid, p: points, k });
  }

  await db.doc(`gameUserPoints/${gameId}`).set({
    gameId,
    entries,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
