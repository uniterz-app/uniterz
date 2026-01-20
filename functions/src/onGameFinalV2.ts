// functions/src/onGameFinalV2.ts

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { applyPostToUserStatsV2 } from "./updateUserStatsV2";
import { calcScorePrecision } from "./calcScorePrecision";

const db = () => getFirestore();

/* =========================
 * Upset 判定用定数
 * ========================= */
const MIN_MARKET = 10;          // 最低投稿数
const UPSET_MARKET_RATIO = 0.7; // 市場偏り 70%
const UPSET_WIN_DIFF = 10;      // 勝数差 10

/* =====================================================
 * Helpers
 * ===================================================== */

function normalizeGame(after: any, gameId: string) {
  return {
    id: gameId,
    league: after?.league ?? undefined,
    homeTeamId: after?.home?.teamId,
    awayTeamId: after?.away?.teamId,
    homeScore: after?.homeScore ?? null,
    awayScore: after?.awayScore ?? null,
    final: !!after?.final,
    homeRank: null as number | null,
    awayRank: null as number | null,
  };
}

function judgeWin(pred: any, result: any) {
  if (pred.winner === "draw") {
    return result.home === result.away;
  }

  return pred.winner === "home"
    ? result.home > result.away
    : result.away > result.home;
}

function calcBrier(isWin: boolean, confidence: number) {
  const p = Math.min(0.999, Math.max(0.001, confidence / 100));
  const y = isWin ? 1 : 0;
  return Math.round((p - y) * (p - y) * 10000) / 10000;
}

function calcScoreError(pred: any, real: any) {
  return Math.abs(pred.home - real.home) + Math.abs(pred.away - real.away);
}

/* =====================================================
 * Main Trigger
 * ===================================================== */

export const onGameFinalV2 = onDocumentWritten(
  {
    document: "games/{gameId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;

    const gameId = event.params.gameId;

    const becameFinal = !before?.final && !!after?.final;
    const scoreChanged =
      before?.homeScore !== after?.homeScore ||
      before?.awayScore !== after?.awayScore;

    if (!becameFinal && !scoreChanged) return;

    const game = normalizeGame(after, gameId);

   /* -----------------------------
 * チーム順位・勝数取得（Upset 判定用）
 * ----------------------------- */
    let homeRank: number | null = null;
let awayRank: number | null = null;
let homeWins = 0;
let awayWins = 0;

let homeConference: "east" | "west" | undefined;
let awayConference: "east" | "west" | undefined;


if (game.homeTeamId && game.awayTeamId) {
  const [hSnap, aSnap] = await Promise.all([
    db().doc(`teams/${game.homeTeamId}`).get(),
    db().doc(`teams/${game.awayTeamId}`).get(),
  ]);

  homeConference = hSnap.data()?.conference;
awayConference = aSnap.data()?.conference;

  homeRank = Number(hSnap.data()?.rank ?? null);
  awayRank = Number(aSnap.data()?.rank ?? null);
  homeWins = Number(hSnap.data()?.wins ?? 0);
  awayWins = Number(aSnap.data()?.wins ?? 0);
}


    game.homeRank = homeRank;
    game.awayRank = awayRank;

    if (!game.final) return;
    if (game.homeScore == null || game.awayScore == null) return;

    /* -----------------------------
 * ユーザー連勝更新（試合単位・1回のみ）
 * ----------------------------- */
if (becameFinal) {
  // この試合で「勝ったユーザー」を一意に判定する
  const final = { home: game.homeScore, away: game.awayScore };

  const usersSnap = await db()
    .collection("posts")
    .where("gameId", "==", gameId)
    .where("schemaVersion", "==", 2)
    .get();

  // uid ごとに「この試合は勝ちか負けか」を確定させる
  const userResult = new Map<string, boolean>();

  usersSnap.docs.forEach((d) => {
    const p = d.data();
    if (userResult.has(p.authorUid)) return; // 同一試合で複数投稿しても1回

    const win = judgeWin(p.prediction, final);
    userResult.set(p.authorUid, win);
  });

  // ユーザーごとに streak 更新（1ユーザー = 1回）
  for (const [uid, didWin] of userResult.entries()) {
    const ref = db().doc(`user_stats_v2/${uid}`);

    await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);

      let current = snap.get("currentStreak") ?? 0;
      let max = snap.get("maxStreak") ?? 0;

      if (didWin) {
        current += 1;
        if (current > max) max = current;
      } else {
        current = 0;
      }

      tx.set(
        ref,
        {
          currentStreak: current,
          maxStreak: max,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  }
}

/* -----------------------------
 * teams stats 更新（NBA / final 確定時のみ）
 * ----------------------------- */
if (
  becameFinal &&
  game.league === "nba" &&
  game.homeTeamId &&
  game.awayTeamId
) {
  if (!homeConference || !awayConference) return;
  const isDraw = game.homeScore === game.awayScore;
  const homeWin = game.homeScore > game.awayScore;
  const awayWin = game.awayScore > game.homeScore;

  const diff = game.homeScore - game.awayScore;
  const isClose = Math.abs(diff) <= 5;

  const homeRef = db().doc(`teams/${game.homeTeamId}`);
  const awayRef = db().doc(`teams/${game.awayTeamId}`);

  const batch = db().batch();

  // ===== HOME TEAM =====
  batch.update(homeRef, {
    gamesPlayed: FieldValue.increment(1),
    pointsForTotal: FieldValue.increment(game.homeScore),
    pointsAgainstTotal: FieldValue.increment(game.awayScore),

    homeGames: FieldValue.increment(1),
    homeWins: FieldValue.increment(homeWin ? 1 : 0),

    vsEastGames: FieldValue.increment(awayConference === "east" ? 1 : 0),
    vsEastWins: FieldValue.increment(
      homeWin && awayConference === "east" ? 1 : 0
    ),

    vsWestGames: FieldValue.increment(awayConference === "west" ? 1 : 0),
    vsWestWins: FieldValue.increment(
      homeWin && awayConference === "west" ? 1 : 0
    ),

    closeGames: FieldValue.increment(isClose ? 1 : 0),
    closeWins: FieldValue.increment(isClose && homeWin ? 1 : 0),

    updatedAt: FieldValue.serverTimestamp(),
  });

  // ===== AWAY TEAM =====
  batch.update(awayRef, {
    gamesPlayed: FieldValue.increment(1),
    pointsForTotal: FieldValue.increment(game.awayScore),
    pointsAgainstTotal: FieldValue.increment(game.homeScore),

    awayGames: FieldValue.increment(1),
    awayWins: FieldValue.increment(awayWin ? 1 : 0),

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

    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

/* -----------------------------
 * teams currentStreak / lastGames 更新
 * ----------------------------- */
if (
  becameFinal &&
  game.league === "nba" &&
  game.homeTeamId &&
  game.awayTeamId
) {
  const homeRef = db().doc(`teams/${game.homeTeamId}`);
  const awayRef = db().doc(`teams/${game.awayTeamId}`);

  const homeWin = game.homeScore! > game.awayScore!;
  const awayWin = game.awayScore! > game.homeScore!;
  const isDraw = game.homeScore === game.awayScore;

  const now = Timestamp.now();

  // ===== HOME TEAM =====
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(homeRef);
    const current = snap.get("currentStreak") ?? 0;
    const lastGames = (snap.get("lastGames") ?? []) as any[];

    let nextStreak = 0;
    if (homeWin) nextStreak = current > 0 ? current + 1 : 1;
    else if (!isDraw) nextStreak = current < 0 ? current - 1 : -1;

    const nextGames = [
      ...lastGames,
      {
        at: now,
        homeAway: "home",
        isWin: homeWin,
        teamScore: game.homeScore!,
        oppScore: game.awayScore!,
        oppTeamId: game.awayTeamId!,
      },
    ].slice(-10);

    tx.set(
      homeRef,
      {
        currentStreak: nextStreak,
        lastGames: nextGames,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  // ===== AWAY TEAM =====
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(awayRef);
    const current = snap.get("currentStreak") ?? 0;
    const lastGames = (snap.get("lastGames") ?? []) as any[];

    let nextStreak = 0;
    if (awayWin) nextStreak = current > 0 ? current + 1 : 1;
    else if (!isDraw) nextStreak = current < 0 ? current - 1 : -1;

    const nextGames = [
      ...lastGames,
      {
        at: now,
        homeAway: "away",
        isWin: awayWin,
        teamScore: game.awayScore!,
        oppScore: game.homeScore!,
        oppTeamId: game.homeTeamId!,
      },
    ].slice(-10);

    tx.set(
      awayRef,
      {
        currentStreak: nextStreak,
        lastGames: nextGames,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

    /* -----------------------------
     * 投稿取得
     * ----------------------------- */
    const postsSnap = await db()
      .collection("posts")
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .get();

 const totalPosts = postsSnap.size;

let hadUpsetGame = false;

    let homeCnt = 0;
let awayCnt = 0;
let drawCnt = 0;

postsSnap.forEach((d) => {
  const w = d.data().prediction.winner;
  if (w === "home") homeCnt++;
  else if (w === "away") awayCnt++;
  else if (w === "draw") drawCnt++;
});

/* -----------------------------
 * Upset Game 判定
 * ----------------------------- */
if (totalPosts >= MIN_MARKET) {
  const majority =
    homeCnt >= awayCnt
      ? { side: "home", ratio: homeCnt / totalPosts }
      : { side: "away", ratio: awayCnt / totalPosts };

  const winnerSide =
    game.homeScore! > game.awayScore! ? "home" : "away";

  const winDiff =
    winnerSide === "home"
      ? awayWins - homeWins
      : homeWins - awayWins;

  if (
    majority.side !== winnerSide &&
    majority.ratio >= UPSET_MARKET_RATIO &&
    winDiff >= UPSET_WIN_DIFF
  ) {
    hadUpsetGame = true;
  // ★ Pro 表示用 Upset メタ保存
  await db().doc(`games/${gameId}`).set(
    {
      upsetMeta: {
        homeRank,
        awayRank,
        homeWins,
        awayWins,
        marketMajoritySide: majority.side,
        marketMajorityRatio: majority.ratio,
        winDiff,
      },
    },
    { merge: true }
  );
}
}



    const now = Timestamp.now();
    const batch = db().batch();
    const userUpdateTasks: Promise<any>[] = [];

    /* -----------------------------
     * 投稿ごとの処理
     * ----------------------------- */
    for (const doc of postsSnap.docs) {
      const p = doc.data();
      if (p.settledAt) continue;

      const final = { home: game.homeScore!, away: game.awayScore! };
      const isWin = judgeWin(p.prediction, final);
      const scoreError = calcScoreError(p.prediction.score, final);
      const conf = Math.min(99, Math.max(1, p.prediction.confidence));
      const brier = calcBrier(isWin, conf);
      const calibrationError = Math.abs(conf / 100 - (isWin ? 1 : 0));

      const { homePt, awayPt, diffPt, totalPt } = calcScorePrecision({
        predictedHome: p.prediction.score.home,
        predictedAway: p.prediction.score.away,
        actualHome: game.homeScore!,
        actualAway: game.awayScore!,
        league: game.league ?? "bj",
      });

      /* -----------------------------
       * 投稿更新バッチ
       * ----------------------------- */
      const upsetHit = hadUpsetGame && isWin;

batch.update(doc.ref, {
  result: final,
  stats: {
    isWin,
    scoreError,
    brier,
    scorePrecision: totalPt,
    scorePrecisionDetail: { homePt, awayPt, diffPt },
    marketCount: totalPosts,

    // ★ Upset 用フラグ（追加）
    hadUpsetGame,
    upsetHit,
  },
  status: "final",
  settledAt: now,
  updatedAt: FieldValue.serverTimestamp(),
});

      /* -----------------------------
       * スタッツ更新 (daily)
       * ----------------------------- */
      userUpdateTasks.push(
        applyPostToUserStatsV2({
          uid: p.authorUid,
          postId: doc.id,
          createdAt: p.createdAt,
          startAt: after.startAtJst ?? after.startAt ?? p.createdAt,
          league: game.league,
          isWin,
          scoreError,
          brier,
          scorePrecision: totalPt,
          confidence: conf,
          calibrationError,
          hadUpsetGame,
        })
      );

      /* -----------------------------
       * ALL TIME キャッシュ更新
       * ----------------------------- */
      userUpdateTasks.push(
        updateAllTimeCache({
          uid: p.authorUid,
          isWin,
          scoreError,
          brier,
          scorePrecision: totalPt,
          calibrationError,
        })
      );
    }

    /* -----------------------------
     * Commit & Wait
     * ----------------------------- */
    await batch.commit();
    await Promise.all(userUpdateTasks);

    /* ★ ここに「再集計リクエスト」だけ追加する */
if (becameFinal) {
  await db().doc("trend_jobs/users").set(
    {
      needsRebuild: true,
      requestedAt: FieldValue.serverTimestamp(),
      gameId,
    },
    { merge: true }
  );
}

    /* -----------------------------
     * ゲーム情報更新
     * ----------------------------- */
    await db().doc(`games/${gameId}`).set(
      {
        "game.status": "final",
        "game.finalScore": { home: game.homeScore, away: game.awayScore },
        resultComputedAtV2: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);

/* =====================================================
 * ALL TIME CACHE（外側に置く）
 * ===================================================== */

async function updateAllTimeCache({
  uid,
  isWin,
  scoreError,
  brier,
  scorePrecision,
  calibrationError, 
}: {
  uid: string;
  isWin: boolean;
  scoreError: number;
  brier: number;
  scorePrecision: number;
  calibrationError: number;
}) {
  const ref = db().doc(`user_stats_v2_all_cache/${uid}`);

  await ref.set(
    {
      posts: FieldValue.increment(1),
      wins: FieldValue.increment(isWin ? 1 : 0),
      scoreErrorSum: FieldValue.increment(scoreError),
      brierSum: FieldValue.increment(brier),
      scorePrecisionSum: FieldValue.increment(scorePrecision),
      calibrationErrorSum: FieldValue.increment(calibrationError),
      calibrationCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
