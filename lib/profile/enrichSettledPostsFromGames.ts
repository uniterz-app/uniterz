import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";

const GAME_FETCH_CHUNK = 25;

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

  for (let i = 0; i < gameIds.length; i += GAME_FETCH_CHUNK) {
    const chunk = gameIds.slice(i, i + GAME_FETCH_CHUNK);
    await Promise.all(
      chunk.map(async (gameId) => {
        try {
          const snap = await getDoc(doc(db, "games", gameId));
          if (!snap.exists()) return;
          const d = snap.data() as Record<string, unknown>;
          meta.set(gameId, {
            seasonPhase: d.seasonPhase ?? null,
            wcStage: d.wcStage ?? null,
          });
        } catch {
          /* 1件失敗しても他は続行 */
        }
      })
    );
  }

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
