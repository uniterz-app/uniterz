// functions/src/fetchGameContext.ts
import { Firestore } from "firebase-admin/firestore";
import type { Timestamp } from "firebase-admin/firestore";

/* =========================
 * Types
 * ========================= */

export type NormalizedGame = {
  id: string;
  league?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore: number | null;
  awayScore: number | null;
  final: boolean;
  homeRank: number | null;
  awayRank: number | null;
  /** 試合開始（lastGames の日時用。JST 優先） */
  playedAt?: Timestamp | null;
  /** regular | play_in | playoffs; omitted/null treated as regular for standings. */
  seasonPhase?: "regular" | "play_in" | "playoffs" | null;
};

export type GameContext = {
  game: NormalizedGame;
  postsSnap: FirebaseFirestore.QuerySnapshot;
  picks: ("home" | "away" | "draw")[];
  homeConference?: "east" | "west";
  awayConference?: "east" | "west";
  homeRank: number | null;
  awayRank: number | null;
  homeWins: number;
  awayWins: number;
};

/* =========================
 * Helpers
 * ========================= */

function normalizeGame(after: any, gameId: string): NormalizedGame {
  return {
    id: gameId,
    league: after?.league,
    homeTeamId: after?.home?.teamId,
    awayTeamId: after?.away?.teamId,
    homeScore: after?.homeScore ?? null,
    awayScore: after?.awayScore ?? null,
    final: !!after?.final,
    homeRank: null,
    awayRank: null,
    playedAt: after?.startAtJst ?? after?.startAt ?? null,
    seasonPhase: after?.seasonPhase ?? null,
  };
}

/* =========================
 * Main
 * ========================= */

export async function fetchGameContext({
  db,
  gameId,
  after,
}: {
  db: Firestore;
  gameId: string;
  after: any;
}): Promise<GameContext | null> {
  const game = normalizeGame(after, gameId);

  if (!game.homeTeamId || !game.awayTeamId) return null;

  const [hSnap, aSnap] = await Promise.all([
    db.doc(`teams/${game.homeTeamId}`).get(),
    db.doc(`teams/${game.awayTeamId}`).get(),
  ]);

  const homeConference = hSnap.data()?.conference as
    | "east"
    | "west"
    | undefined;
  const awayConference = aSnap.data()?.conference as
    | "east"
    | "west"
    | undefined;

  const homeRank = Number(hSnap.data()?.rank ?? null);
  const awayRank = Number(aSnap.data()?.rank ?? null);
  const homeWins = Number(hSnap.data()?.wins ?? 0);
  const awayWins = Number(aSnap.data()?.wins ?? 0);

  game.homeRank = homeRank;
  game.awayRank = awayRank;

  const postsSnap = await db
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  const picks = postsSnap.docs.map(
    (d) => d.data().prediction.winner as "home" | "away" | "draw"
  );

  return {
    game,
    postsSnap,
    picks,
    homeConference,
    awayConference,
    homeRank,
    awayRank,
    homeWins,
    awayWins,
  };
}
