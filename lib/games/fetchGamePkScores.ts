import {
  collection,
  documentId,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { resolvePkScore, type PkScore } from "@/lib/games/pkScore";

const CHUNK = 30;

/** games から pkScore をまとめて取得（リザルト一覧の補完用） */
export async function fetchGamePkScores(
  db: Firestore,
  gameIds: readonly string[]
): Promise<Record<string, PkScore>> {
  const ids = [...new Set(gameIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const out: Record<string, PkScore> = {};
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    chunks.push(ids.slice(i, i + CHUNK));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const snap = await getDocs(
          query(collection(db, "games"), where(documentId(), "in", chunk))
        );
        for (const docSnap of snap.docs) {
          const pk = resolvePkScore(docSnap.data() as Record<string, unknown>);
          if (pk) out[docSnap.id] = pk;
        }
      } catch {
        // 補完失敗時は post 側の pkScore のみ使う
      }
    })
  );

  return out;
}
