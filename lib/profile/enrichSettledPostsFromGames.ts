import {
  collection,
  documentId,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { resolvePostListLeague } from "@/lib/leagues";
import type { SettledPostRow } from "@/lib/profile/profileStreakPostsCompute";
import { resolveWcStageFromGame } from "@/lib/wc/resolveWcStage";

const GAME_FETCH_CHUNK = 30;

function needsGameLookup(row: SettledPostRow): boolean {
  if (!row.gameId) return false;
  const league = resolvePostListLeague({
    league: row.league,
    gameId: row.gameId,
  });
  if (league === "wc") {
    return row.wcStage == null || row.wcStage === "";
  }
  if (league === "nba") {
    return row.seasonPhase == null || row.seasonPhase === "";
  }
  return false;
}

/**
 * 旧投稿は posts に seasonPhase / wcStage が無いため、games から補完する。
 */
export async function enrichSettledPostsFromGames(
  rows: SettledPostRow[],
  firestore: Firestore
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
    { seasonPhase: unknown; wcStage: unknown; league: unknown }
  >();

  const chunks: string[][] = [];
  for (let i = 0; i < gameIds.length; i += GAME_FETCH_CHUNK) {
    chunks.push(gameIds.slice(i, i + GAME_FETCH_CHUNK));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const snap = await getDocs(
          query(
            collection(firestore, "games"),
            where(documentId(), "in", chunk)
          )
        );
        for (const d of snap.docs) {
          const data = d.data() as Record<string, unknown>;
          const resolvedWcStage = resolveWcStageFromGame({
            knockout: data.knockout as boolean | null | undefined,
            roundLabel: data.roundLabel as string | null | undefined,
            wcStage: data.wcStage as string | null | undefined,
          });
          meta.set(d.id, {
            seasonPhase: data.seasonPhase ?? null,
            wcStage: resolvedWcStage ?? data.wcStage ?? null,
            league: data.league ?? null,
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
      league: resolvePostListLeague({
        league: row.league ?? g.league,
        gameId: row.gameId,
      }),
      seasonPhase: row.seasonPhase ?? g.seasonPhase,
      wcStage: row.wcStage ?? g.wcStage,
    };
  });
}
