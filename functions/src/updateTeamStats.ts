import { FieldValue, Timestamp } from "firebase-admin/firestore";

export type NBAStatsTarget = "regular" | "playoffs";

function rankToGroup(rank: number | null): number | null {
  if (rank == null) return null;
  if (rank <= 6) return 1;
  if (rank <= 12) return 2;
  if (rank <= 18) return 3;
  if (rank <= 24) return 4;
  return 5;
}

function fieldKey(prefix: string, name: string): string {
  return `${prefix}${name}`;
}

export async function updateTeamStats({
  db,
  game,
  homeConference,
  awayConference,
  homeWins,
  awayWins,
  target = "regular",
}: {
  db: FirebaseFirestore.Firestore;
  game: {
    league?: string;
    homeTeamId?: string;
    awayTeamId?: string;
    homeScore: number;
    awayScore: number;
    homeRank: number | null;
    awayRank: number | null;
    playedAt?: Timestamp | null;
  };
  homeConference?: "east" | "west";
  awayConference?: "east" | "west";
  homeWins: number;
  awayWins: number;
  target?: NBAStatsTarget;
}) {
  if (
    game.league !== "nba" ||
    !game.homeTeamId ||
    !game.awayTeamId
  ) {
    return;
  }

  if (!homeConference || !awayConference) return;

  const pfx = target === "playoffs" ? "playoffNba." : "";

  const homeWin = game.homeScore > game.awayScore;
  const awayWin = game.awayScore > game.homeScore;
  const isDraw = game.homeScore === game.awayScore;

  const homeGroup = rankToGroup(game.homeRank);
  const awayGroup = rankToGroup(game.awayRank);

  let homeGroupRelation: "higher" | "same" | "lower" | "higherBig" | "lowerBig" | null =
    null;
  let awayGroupRelation: typeof homeGroupRelation = null;

  if (
    homeGroup != null &&
    awayGroup != null &&
    game.homeRank != null &&
    game.awayRank != null
  ) {
    const rankDiff = game.awayRank - game.homeRank;

    if (Math.abs(rankDiff) <= 2) {
      homeGroupRelation = "same";
      awayGroupRelation = "same";
    } else {
      const groupDiff = awayGroup - homeGroup;

      if (groupDiff <= -2) homeGroupRelation = "higherBig";
      else if (groupDiff === -1) homeGroupRelation = "higher";
      else if (groupDiff === 0) homeGroupRelation = "same";
      else if (groupDiff === 1) homeGroupRelation = "lower";
      else if (groupDiff >= 2) homeGroupRelation = "lowerBig";

      if (groupDiff >= 2) awayGroupRelation = "higherBig";
      else if (groupDiff === 1) awayGroupRelation = "higher";
      else if (groupDiff === 0) awayGroupRelation = "same";
      else if (groupDiff === -1) awayGroupRelation = "lower";
      else if (groupDiff <= -2) awayGroupRelation = "lowerBig";
    }
  }

  const homeVsHigher = awayWins > homeWins;
  const homeVsLower = awayWins < homeWins;

  const awayVsHigher = homeWins > awayWins;
  const awayVsLower = homeWins < awayWins;

  const diff = game.homeScore - game.awayScore;
  const isClose = Math.abs(diff) <= 5;

  const homeRef = db.doc(`teams/${game.homeTeamId}`);
  const awayRef = db.doc(`teams/${game.awayTeamId}`);

  const batch = db.batch();

  batch.update(homeRef, {
    [fieldKey(pfx, "gamesPlayed")]: FieldValue.increment(1),
    [fieldKey(pfx, "pointsForTotal")]: FieldValue.increment(game.homeScore),
    [fieldKey(pfx, "pointsAgainstTotal")]: FieldValue.increment(game.awayScore),

    [fieldKey(pfx, "homeGames")]: FieldValue.increment(1),
    [fieldKey(pfx, "homeWins")]: FieldValue.increment(homeWin ? 1 : 0),

    [fieldKey(pfx, "vsHigherGames")]: FieldValue.increment(homeVsHigher ? 1 : 0),
    [fieldKey(pfx, "vsHigherWins")]: FieldValue.increment(
      homeVsHigher && homeWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsLowerGames")]: FieldValue.increment(homeVsLower ? 1 : 0),
    [fieldKey(pfx, "vsLowerWins")]: FieldValue.increment(
      homeVsLower && homeWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsEastGames")]: FieldValue.increment(
      awayConference === "east" ? 1 : 0
    ),
    [fieldKey(pfx, "vsEastWins")]: FieldValue.increment(
      homeWin && awayConference === "east" ? 1 : 0
    ),

    [fieldKey(pfx, "homePointsForTotal")]: FieldValue.increment(game.homeScore),
    [fieldKey(pfx, "homePointsAgainstTotal")]: FieldValue.increment(
      game.awayScore
    ),

    [fieldKey(pfx, "vsWestGames")]: FieldValue.increment(
      awayConference === "west" ? 1 : 0
    ),
    [fieldKey(pfx, "vsWestWins")]: FieldValue.increment(
      homeWin && awayConference === "west" ? 1 : 0
    ),

    [fieldKey(pfx, "closeGames")]: FieldValue.increment(isClose ? 1 : 0),
    [fieldKey(pfx, "closeWins")]: FieldValue.increment(isClose && homeWin ? 1 : 0),

    [fieldKey(pfx, "vsGroupHigherBigGames")]: FieldValue.increment(
      homeGroupRelation === "higherBig" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupHigherBigWins")]: FieldValue.increment(
      homeGroupRelation === "higherBig" && homeWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupHigherGames")]: FieldValue.increment(
      homeGroupRelation === "higher" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupHigherWins")]: FieldValue.increment(
      homeGroupRelation === "higher" && homeWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupSameGames")]: FieldValue.increment(
      homeGroupRelation === "same" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupSameWins")]: FieldValue.increment(
      homeGroupRelation === "same" && homeWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupLowerGames")]: FieldValue.increment(
      homeGroupRelation === "lower" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupLowerWins")]: FieldValue.increment(
      homeGroupRelation === "lower" && homeWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupLowerBigGames")]: FieldValue.increment(
      homeGroupRelation === "lowerBig" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupLowerBigWins")]: FieldValue.increment(
      homeGroupRelation === "lowerBig" && homeWin ? 1 : 0
    ),

    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.update(awayRef, {
    [fieldKey(pfx, "gamesPlayed")]: FieldValue.increment(1),
    [fieldKey(pfx, "pointsForTotal")]: FieldValue.increment(game.awayScore),
    [fieldKey(pfx, "pointsAgainstTotal")]: FieldValue.increment(game.homeScore),

    [fieldKey(pfx, "awayGames")]: FieldValue.increment(1),
    [fieldKey(pfx, "awayWins")]: FieldValue.increment(awayWin ? 1 : 0),

    [fieldKey(pfx, "vsHigherGames")]: FieldValue.increment(awayVsHigher ? 1 : 0),
    [fieldKey(pfx, "vsHigherWins")]: FieldValue.increment(
      awayVsHigher && awayWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsLowerGames")]: FieldValue.increment(awayVsLower ? 1 : 0),
    [fieldKey(pfx, "vsLowerWins")]: FieldValue.increment(
      awayVsLower && awayWin ? 1 : 0
    ),

    [fieldKey(pfx, "awayPointsForTotal")]: FieldValue.increment(game.awayScore),
    [fieldKey(pfx, "awayPointsAgainstTotal")]: FieldValue.increment(
      game.homeScore
    ),

    [fieldKey(pfx, "vsEastGames")]: FieldValue.increment(
      homeConference === "east" ? 1 : 0
    ),
    [fieldKey(pfx, "vsEastWins")]: FieldValue.increment(
      awayWin && homeConference === "east" ? 1 : 0
    ),

    [fieldKey(pfx, "vsWestGames")]: FieldValue.increment(
      homeConference === "west" ? 1 : 0
    ),
    [fieldKey(pfx, "vsWestWins")]: FieldValue.increment(
      awayWin && homeConference === "west" ? 1 : 0
    ),

    [fieldKey(pfx, "closeGames")]: FieldValue.increment(isClose ? 1 : 0),
    [fieldKey(pfx, "closeWins")]: FieldValue.increment(isClose && awayWin ? 1 : 0),

    [fieldKey(pfx, "vsGroupHigherBigGames")]: FieldValue.increment(
      awayGroupRelation === "higherBig" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupHigherBigWins")]: FieldValue.increment(
      awayGroupRelation === "higherBig" && awayWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupHigherGames")]: FieldValue.increment(
      awayGroupRelation === "higher" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupHigherWins")]: FieldValue.increment(
      awayGroupRelation === "higher" && awayWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupSameGames")]: FieldValue.increment(
      awayGroupRelation === "same" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupSameWins")]: FieldValue.increment(
      awayGroupRelation === "same" && awayWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupLowerGames")]: FieldValue.increment(
      awayGroupRelation === "lower" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupLowerWins")]: FieldValue.increment(
      awayGroupRelation === "lower" && awayWin ? 1 : 0
    ),

    [fieldKey(pfx, "vsGroupLowerBigGames")]: FieldValue.increment(
      awayGroupRelation === "lowerBig" ? 1 : 0
    ),
    [fieldKey(pfx, "vsGroupLowerBigWins")]: FieldValue.increment(
      awayGroupRelation === "lowerBig" && awayWin ? 1 : 0
    ),

    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const now = Timestamp.now();
  const playedAtForEntry: Timestamp =
    game.playedAt && typeof game.playedAt.toMillis === "function"
      ? game.playedAt
      : now;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  function calcIsB2B(lastGames: any[], currentPlayedAt: Timestamp) {
    const prevAt =
      lastGames.length > 0 ? lastGames[lastGames.length - 1]?.at : null;
    if (prevAt == null || typeof prevAt.toMillis !== "function") return false;
    return (
      Math.abs(currentPlayedAt.toMillis() - prevAt.toMillis()) <= ONE_DAY_MS
    );
  }

  const kCurrent = fieldKey(pfx, "currentStreak");
  const kLast = fieldKey(pfx, "lastGames");
  const kB2bG = fieldKey(pfx, "b2bGames");
  const kB2bW = fieldKey(pfx, "b2bWins");

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(homeRef);
    const current = Number(snap.get(kCurrent) ?? 0);
    const lastGames = (snap.get(kLast) ?? []) as any[];
    const isB2B = calcIsB2B(lastGames, playedAtForEntry);

    let nextStreak = 0;
    if (homeWin) nextStreak = current > 0 ? current + 1 : 1;
    else if (!isDraw) nextStreak = current < 0 ? current - 1 : -1;

    tx.set(
      homeRef,
      {
        [kCurrent]: nextStreak,
        [kB2bG]: FieldValue.increment(isB2B ? 1 : 0),
        [kB2bW]: FieldValue.increment(isB2B && homeWin ? 1 : 0),
        [kLast]: [
          ...lastGames,
          {
            at: playedAtForEntry,
            playedAt: playedAtForEntry,
            homeAway: "home",
            isWin: homeWin,
            teamScore: game.homeScore,
            oppScore: game.awayScore,
            oppTeamId: game.awayTeamId,
            selfRank: game.homeRank,
            oppRank: game.awayRank,
            rankDiff: game.awayRank - game.homeRank,
          },
        ].slice(-10),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(awayRef);
    const current = Number(snap.get(kCurrent) ?? 0);
    const lastGames = (snap.get(kLast) ?? []) as any[];

    let nextStreak = 0;
    if (awayWin) nextStreak = current > 0 ? current + 1 : 1;
    else if (!isDraw) nextStreak = current < 0 ? current - 1 : -1;
    const isB2B = calcIsB2B(lastGames, playedAtForEntry);

    tx.set(
      awayRef,
      {
        [kCurrent]: nextStreak,
        [kB2bG]: FieldValue.increment(isB2B ? 1 : 0),
        [kB2bW]: FieldValue.increment(isB2B && awayWin ? 1 : 0),
        [kLast]: [
          ...lastGames,
          {
            at: playedAtForEntry,
            playedAt: playedAtForEntry,
            homeAway: "away",
            isWin: awayWin,
            teamScore: game.awayScore,
            oppScore: game.homeScore,
            oppTeamId: game.homeTeamId,
            selfRank: game.awayRank,
            oppRank: game.homeRank,
            rankDiff: game.homeRank - game.awayRank,
          },
        ].slice(-10),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}
