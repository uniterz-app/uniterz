import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";

const GAME_FETCH_CHUNK = 30;

function needsGameLookup(row: SettledPostRow): boolean {
  if (row.seasonPhase != null && row.seasonPhase !== "") return false;
  if (row.wcStage != null && row.wcStage !== "") return false;
  return Boolean(row.gameId);
}

/**
 * 旧投稿は posts に seasonPhase / wcStage が無いため、games から補完する。
 */
export async function enrichSettledPostsFromGames(
  rows: SettledPostRow[]
): Promise<SettledPostRow[]> {
  const gameIds = [
    ...new Set(
      rows
        .filter(needsGameLookup)
        .map((r) => r.gameId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  if (gameIds.length === 0) return rows;

  const meta = new Map<
    string,
    { seasonPhase: unknown; wcStage: unknown }
  >();

  const chunks: string[][] = [];
  for (let i = 0; i < gameIds.length; i += GAME_FETCH_CHUNK) {
    chunks.push(gameIds.slice(i, i + GAME_FETCH_CHUNK));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const snap = await getDocs(
          query(collection(db, "games"), where(documentId(), "in", chunk))
        );
        for (const d of snap.docs) {
          const data = d.data() as Record<string, unknown>;
          meta.set(d.id, {
            seasonPhase: data.seasonPhase ?? null,
            wcStage: data.wcStage ?? null,
          });
        }
      } catch {
        // 補完に失敗しても posts 側の値だけで表示を続ける。
      }
    })
  );

  return rows.map((row) => {
    if (!row.gameId) return row;
    const g = meta.get(row.gameId);
    if (!g) return row;
    return {
      ...row,
      seasonPhase: row.seasonPhase ?? g.seasonPhase,
      wcStage: row.wcStage ?? g.wcStage,
    };
  });
}
