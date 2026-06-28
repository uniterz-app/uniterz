import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { WC_KNOCKOUT_BRACKET_SEASON } from "./wcKnockoutMatchIds";
import { enqueueWcBracketRescoreChain } from "./wcBracketRescoreChunked";
import {
  resolveKnockoutWinnerTeamId,
  resolveWcKnockoutMatchIdFromGame,
} from "./resolveKnockoutWinner";
import { maybeCreateChildKnockoutGames } from "./createChildKnockoutGames";

export type KnockoutGameFinalInput = {
  gameId: string;
  season?: string | null;
  league?: string | null;
  knockout?: boolean;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  advancingTeamId?: string | null;
  wcKnockoutMatchId?: string | null;
};

/**
 * WC ノックアウト試合が final になったとき:
 * 1. wcBracketResults に当該試合の勝者を追記
 * 2. 全提出ブラケットの survivor 再評価キューを投入
 * 3. 両親が確定した子試合を games に自動生成（Phase 3）
 */
export async function maybeUpdateWcBracketOnKnockoutFinal(
  db: Firestore,
  game: KnockoutGameFinalInput
): Promise<{
  updated: boolean;
  matchId?: string;
  winnerTeamId?: string;
  childGamesCreated?: string[];
}> {
  if (String(game.league ?? "").trim().toLowerCase() !== "wc") {
    return { updated: false };
  }
  if (game.knockout !== true) {
    return { updated: false };
  }

  const matchId = resolveWcKnockoutMatchIdFromGame({
    ...game,
    id: game.gameId,
    wcKnockoutMatchId: game.wcKnockoutMatchId,
  });
  if (!matchId) {
    console.warn(
      `[wc-bracket] skip game ${game.gameId}: missing wcKnockoutMatchId`
    );
    return { updated: false };
  }

  const winnerTeamId = resolveKnockoutWinnerTeamId(game);
  if (!winnerTeamId) {
    console.warn(
      `[wc-bracket] skip game ${game.gameId} (${matchId}): no winner teamId`
    );
    return { updated: false };
  }

  const season = String(game.season ?? WC_KNOCKOUT_BRACKET_SEASON).trim();
  const resultsRef = db.collection("wcBracketResults").doc(season);

  let mergedWinners: Record<string, string> = {};

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(resultsRef);
    const prev = (snap.data()?.winners ?? {}) as Record<string, string>;
    const existing = prev[matchId]?.trim();
    if (existing && existing !== winnerTeamId) {
      console.warn(
        `[wc-bracket] winners.${matchId} overwrite ${existing} → ${winnerTeamId}`
      );
    }
    mergedWinners = {
      ...prev,
      [matchId]: winnerTeamId,
    };
    tx.set(
      resultsRef,
      {
        season,
        winners: mergedWinners,
        lastMatchId: matchId,
        lastGameId: game.gameId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await enqueueWcBracketRescoreChain(db, season);

  let childGamesCreated: string[] = [];
  try {
    childGamesCreated = await maybeCreateChildKnockoutGames(db, {
      season,
      finishedMatchId: matchId,
      winners: mergedWinners,
    });
  } catch (err) {
    console.error(
      `[wc-bracket] child game creation failed after ${matchId}`,
      err
    );
  }

  console.log(
    `[wc-bracket] ${matchId} final via game ${game.gameId} → winner ${winnerTeamId}` +
      (childGamesCreated.length
        ? `; child games: ${childGamesCreated.join(", ")}`
        : "")
  );

  return {
    updated: true,
    matchId,
    winnerTeamId,
    childGamesCreated,
  };
}
