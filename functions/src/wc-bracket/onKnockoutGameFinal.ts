import type { Firestore } from "firebase-admin/firestore";
import { WC_KNOCKOUT_BRACKET_SEASON } from "./wcKnockoutMatchIds";
import {
  resolveKnockoutWinnerTeamId,
  resolveWcKnockoutMatchIdFromGame,
} from "./resolveKnockoutWinner";
import { resolveKnockoutLoserTeamId } from "./resolveKnockoutLoser";
import { maybeCreateChildKnockoutGames } from "./createChildKnockoutGames";
import {
  defaultWcFirestoreWriteDeps,
  type WcFirestoreWriteDeps,
} from "./wcFirestoreWriteDeps";

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
 * WC ノックアウト試合が final になったとき（onGameFinalV2 / 管理スクリプト）:
 * 1. wcBracketResults に当該試合の勝者を追記
 * 2. 両親が確定した子試合を games に自動生成
 *
 * ユーザー提出ブラケットの survivor 再採点は廃止（2026-07）。
 */
export async function maybeUpdateWcBracketOnKnockoutFinal(
  db: Firestore,
  game: KnockoutGameFinalInput,
  writeDeps: WcFirestoreWriteDeps = defaultWcFirestoreWriteDeps()
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

  const loserTeamId = resolveKnockoutLoserTeamId({
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    advancingTeamId: game.advancingTeamId,
    knockout: game.knockout === true,
    final: true,
  });

  const season = String(game.season ?? WC_KNOCKOUT_BRACKET_SEASON).trim();
  const resultsRef = db.collection("wcBracketResults").doc(season);

  let mergedWinners: Record<string, string> = {};
  let mergedLosers: Record<string, string> = {};

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(resultsRef);
    const prev = snap.data() ?? {};
    const prevWinners = (prev.winners ?? {}) as Record<string, string>;
    const prevLosers = (prev.losers ?? {}) as Record<string, string>;
    const existing = prevWinners[matchId]?.trim();
    if (existing && existing !== winnerTeamId) {
      console.warn(
        `[wc-bracket] winners.${matchId} overwrite ${existing} → ${winnerTeamId}`
      );
    }
    mergedWinners = {
      ...prevWinners,
      [matchId]: winnerTeamId,
    };
    mergedLosers = { ...prevLosers };
    if (loserTeamId) {
      mergedLosers[matchId] = loserTeamId;
    }
    tx.set(
      resultsRef,
      {
        season,
        winners: mergedWinners,
        losers: mergedLosers,
        lastMatchId: matchId,
        lastGameId: game.gameId,
        updatedAt: writeDeps.serverTimestamp(),
      },
      { merge: true }
    );
  });

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
