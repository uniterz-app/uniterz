import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { WC_KNOCKOUT_BRACKET_SEASON } from "./wcKnockoutMatchIds";
import { enqueueWcBracketRescoreChain } from "./wcBracketRescoreChunked";
import {
  resolveKnockoutWinnerTeamId,
  resolveWcKnockoutMatchIdFromGame,
} from "./resolveKnockoutWinner";

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
 */
export async function maybeUpdateWcBracketOnKnockoutFinal(
  db: Firestore,
  game: KnockoutGameFinalInput
): Promise<{ updated: boolean; matchId?: string; winnerTeamId?: string }> {
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

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(resultsRef);
    const prev = (snap.data()?.winners ?? {}) as Record<string, string>;
    const existing = prev[matchId]?.trim();
    if (existing && existing !== winnerTeamId) {
      console.warn(
        `[wc-bracket] winners.${matchId} overwrite ${existing} → ${winnerTeamId}`
      );
    }
    tx.set(
      resultsRef,
      {
        season,
        winners: {
          ...prev,
          [matchId]: winnerTeamId,
        },
        lastMatchId: matchId,
        lastGameId: game.gameId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await enqueueWcBracketRescoreChain(db, season);

  console.log(
    `[wc-bracket] ${matchId} final via game ${game.gameId} → winner ${winnerTeamId}`
  );

  return { updated: true, matchId, winnerTeamId };
}
