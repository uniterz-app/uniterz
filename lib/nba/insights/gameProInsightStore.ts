/**
 * Pro Insight の保存先 `gameProInsights/{gameId}`（Admin SDK 専用・クライアント読み取り不可）。
 *
 * `games/{gameId}` は誰でも読めるため、有料コンテンツはそこに置かない。
 * 旧データ（games 上のフィールド）は移行スクリプトで移すまで読み取りだけフォールバックする。
 */
import type { Firestore } from "firebase-admin/firestore";

export const GAME_PRO_INSIGHTS_COLLECTION = "gameProInsights";

export const GAME_PRO_INSIGHT_FIELDS = [
  "proInsightNarrative",
  "proInsightFacts",
  "proBrief",
  "proBriefUpdatedAt",
] as const;

export type GameProInsightField = (typeof GAME_PRO_INSIGHT_FIELDS)[number];
export type GameProInsightDoc = Partial<Record<GameProInsightField, unknown>>;

export function gameProInsightRef(db: Firestore, gameId: string) {
  return db.collection(GAME_PRO_INSIGHTS_COLLECTION).doc(gameId);
}

/** `legacyGameData` を渡すと games 側の読み直しを省く */
export async function loadGameProInsight(
  db: Firestore,
  gameId: string,
  legacyGameData?: Record<string, unknown> | null
): Promise<GameProInsightDoc> {
  const [snap, legacy] = await Promise.all([
    gameProInsightRef(db, gameId).get(),
    legacyGameData !== undefined
      ? Promise.resolve(legacyGameData)
      : db
          .collection("games")
          .doc(gameId)
          .get()
          .then((d) => (d.data() as Record<string, unknown> | undefined) ?? null),
  ]);
  const stored = (snap.data() as GameProInsightDoc | undefined) ?? {};
  const out: GameProInsightDoc = {};
  for (const key of GAME_PRO_INSIGHT_FIELDS) {
    out[key] = stored[key] ?? legacy?.[key];
  }
  return out;
}

export async function writeGameProInsight(
  db: Firestore,
  gameId: string,
  patch: GameProInsightDoc
): Promise<void> {
  await gameProInsightRef(db, gameId).set(patch, { merge: true });
}
