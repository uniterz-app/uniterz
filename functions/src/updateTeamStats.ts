import { FieldValue, Timestamp } from "firebase-admin/firestore";

function rankToGroup(rank: number | null): number | null {
  if (rank == null) return null;
  if (rank <= 6) return 1;   // 優勝候補
  if (rank <= 12) return 2;  // 強豪
  if (rank <= 18) return 3;  // 平均
  if (rank <= 24) return 4;  // 弱
  return 5;                  // 弱小
}


export async function updateTeamStats({
  db,
  game,
  homeConference,
  awayConference,
  homeWins,   // ★ 追加
  awayWins,   // ★ 追加
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
  };
  homeConference?: "east" | "west";
  awayConference?: "east" | "west";
  homeWins: number;
  awayWins: number;
})
 {
  // ===== ガード =====
  if (
    game.league !== "nba" ||
    !game.homeTeamId ||
    !game.awayTeamId
  ) {
    return;
  }

  if (!homeConference || !awayConference) return;

  // ===== 勝敗判定 =====
  const homeWin = game.homeScore > game.awayScore;
  const awayWin = game.awayScore > game.homeScore;
  const isDraw = game.homeScore === game.awayScore;

  // ===== 順位差クッション付きグループ判定 =====
const homeGroup = rankToGroup(game.homeRank);
const awayGroup = rankToGroup(game.awayRank);

let homeGroupRelation: "higher" | "same" | "lower" | "higherBig" | "lowerBig" | null = null;
let awayGroupRelation: typeof homeGroupRelation = null;

if (
  homeGroup != null &&
  awayGroup != null &&
  game.homeRank != null &&
  game.awayRank != null
) {
  const rankDiff = game.awayRank - game.homeRank;

  // クッション：±2 は無条件で同格
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

    // 反転
    if (groupDiff >= 2) awayGroupRelation = "higherBig";
    else if (groupDiff === 1) awayGroupRelation = "higher";
    else if (groupDiff === 0) awayGroupRelation = "same";
    else if (groupDiff === -1) awayGroupRelation = "lower";
    else if (groupDiff <= -2) awayGroupRelation = "lowerBig";
  }
}

  // ===== 勝率比較（試合時点・勝数ベース）=====
const homeVsHigher = awayWins > homeWins;
const homeVsLower  = awayWins < homeWins;

const awayVsHigher = homeWins > awayWins;
const awayVsLower  = homeWins < awayWins;


  const diff = game.homeScore - game.awayScore;
  const isClose = Math.abs(diff) <= 5;

  const homeRef = db.doc(`teams/${game.homeTeamId}`);
  const awayRef = db.doc(`teams/${game.awayTeamId}`);

  // ===== 累計スタッツ更新 =====
  const batch = db.batch();

  // HOME
  batch.update(homeRef, {
    gamesPlayed: FieldValue.increment(1),
    pointsForTotal: FieldValue.increment(game.homeScore),
    pointsAgainstTotal: FieldValue.increment(game.awayScore),

    homeGames: FieldValue.increment(1),
    homeWins: FieldValue.increment(homeWin ? 1 : 0),

      vsHigherGames: FieldValue.increment(homeVsHigher ? 1 : 0),
  vsHigherWins: FieldValue.increment(
    homeVsHigher && homeWin ? 1 : 0
  ),

  vsLowerGames: FieldValue.increment(homeVsLower ? 1 : 0),
  vsLowerWins: FieldValue.increment(
    homeVsLower && homeWin ? 1 : 0
  ),

    vsEastGames: FieldValue.increment(awayConference === "east" ? 1 : 0),
    vsEastWins: FieldValue.increment(
      homeWin && awayConference === "east" ? 1 : 0
    ),

      homePointsForTotal: FieldValue.increment(game.homeScore),
  homePointsAgainstTotal: FieldValue.increment(game.awayScore),

    vsWestGames: FieldValue.increment(awayConference === "west" ? 1 : 0),
    vsWestWins: FieldValue.increment(
      homeWin && awayConference === "west" ? 1 : 0
    ),

    closeGames: FieldValue.increment(isClose ? 1 : 0),
    closeWins: FieldValue.increment(isClose && homeWin ? 1 : 0),

    vsGroupHigherBigGames: FieldValue.increment(homeGroupRelation === "higherBig" ? 1 : 0),
vsGroupHigherBigWins: FieldValue.increment(
  homeGroupRelation === "higherBig" && homeWin ? 1 : 0
),

vsGroupHigherGames: FieldValue.increment(homeGroupRelation === "higher" ? 1 : 0),
vsGroupHigherWins: FieldValue.increment(
  homeGroupRelation === "higher" && homeWin ? 1 : 0
),

vsGroupSameGames: FieldValue.increment(homeGroupRelation === "same" ? 1 : 0),
vsGroupSameWins: FieldValue.increment(
  homeGroupRelation === "same" && homeWin ? 1 : 0
),

vsGroupLowerGames: FieldValue.increment(homeGroupRelation === "lower" ? 1 : 0),
vsGroupLowerWins: FieldValue.increment(
  homeGroupRelation === "lower" && homeWin ? 1 : 0
),

vsGroupLowerBigGames: FieldValue.increment(homeGroupRelation === "lowerBig" ? 1 : 0),
vsGroupLowerBigWins: FieldValue.increment(
  homeGroupRelation === "lowerBig" && homeWin ? 1 : 0
),


    updatedAt: FieldValue.serverTimestamp(),
  });

  // AWAY
  batch.update(awayRef, {
    gamesPlayed: FieldValue.increment(1),
    pointsForTotal: FieldValue.increment(game.awayScore),
    pointsAgainstTotal: FieldValue.increment(game.homeScore),

    awayGames: FieldValue.increment(1),
    awayWins: FieldValue.increment(awayWin ? 1 : 0),

      vsHigherGames: FieldValue.increment(awayVsHigher ? 1 : 0),
  vsHigherWins: FieldValue.increment(
    awayVsHigher && awayWin ? 1 : 0
  ),

  vsLowerGames: FieldValue.increment(awayVsLower ? 1 : 0),
  vsLowerWins: FieldValue.increment(
    awayVsLower && awayWin ? 1 : 0
  ),

      awayPointsForTotal: FieldValue.increment(game.awayScore),
  awayPointsAgainstTotal: FieldValue.increment(game.homeScore),

    vsEastGames: FieldValue.increment(homeConference === "east" ? 1 : 0),
    vsEastWins: FieldValue.increment(
      awayWin && homeConference === "east" ? 1 : 0
    ),

    vsWestGames: FieldValue.increment(homeConference === "west" ? 1 : 0),
    vsWestWins: FieldValue.increment(
      awayWin && homeConference === "west" ? 1 : 0
    ),

    closeGames: FieldValue.increment(isClose ? 1 : 0),
    closeWins: FieldValue.increment(isClose && awayWin ? 1 : 0),

    vsGroupHigherBigGames: FieldValue.increment(awayGroupRelation === "higherBig" ? 1 : 0),
vsGroupHigherBigWins: FieldValue.increment(
  awayGroupRelation === "higherBig" && awayWin ? 1 : 0
),

vsGroupHigherGames: FieldValue.increment(awayGroupRelation === "higher" ? 1 : 0),
vsGroupHigherWins: FieldValue.increment(
  awayGroupRelation === "higher" && awayWin ? 1 : 0
),

vsGroupSameGames: FieldValue.increment(awayGroupRelation === "same" ? 1 : 0),
vsGroupSameWins: FieldValue.increment(
  awayGroupRelation === "same" && awayWin ? 1 : 0
),

vsGroupLowerGames: FieldValue.increment(awayGroupRelation === "lower" ? 1 : 0),
vsGroupLowerWins: FieldValue.increment(
  awayGroupRelation === "lower" && awayWin ? 1 : 0
),

vsGroupLowerBigGames: FieldValue.increment(awayGroupRelation === "lowerBig" ? 1 : 0),
vsGroupLowerBigWins: FieldValue.increment(
  awayGroupRelation === "lowerBig" && awayWin ? 1 : 0
),


    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // ===== currentStreak / lastGames =====
  const now = Timestamp.now();

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function calcIsB2B(lastGames: any[]) {
  const prevAt =
    lastGames.length > 0 ? lastGames[lastGames.length - 1].at : null;

  return (
    prevAt != null &&
    now.toMillis() - prevAt.toMillis() <= ONE_DAY_MS
  );
}

  // HOME
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(homeRef);
    const current = snap.get("currentStreak") ?? 0;
    const lastGames = (snap.get("lastGames") ?? []) as any[];
    const isB2B = calcIsB2B(lastGames);

    let nextStreak = 0;
    if (homeWin) nextStreak = current > 0 ? current + 1 : 1;
    else if (!isDraw) nextStreak = current < 0 ? current - 1 : -1;

tx.set(
  homeRef,
  {
    currentStreak: nextStreak,

    b2bGames: FieldValue.increment(isB2B ? 1 : 0),
    b2bWins: FieldValue.increment(isB2B && homeWin ? 1 : 0),

    lastGames: [
      ...lastGames,
      {
        at: now,
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

  // AWAY
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(awayRef);
    const current = snap.get("currentStreak") ?? 0;
    const lastGames = (snap.get("lastGames") ?? []) as any[];

    let nextStreak = 0;
    if (awayWin) nextStreak = current > 0 ? current + 1 : 1;
    else if (!isDraw) nextStreak = current < 0 ? current - 1 : -1;
    const isB2B = calcIsB2B(lastGames);


tx.set(
  awayRef,
  {
    currentStreak: nextStreak,

    b2bGames: FieldValue.increment(isB2B ? 1 : 0),
    b2bWins: FieldValue.increment(isB2B && awayWin ? 1 : 0),

    lastGames: [
      ...lastGames,
      {
        at: now,
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
