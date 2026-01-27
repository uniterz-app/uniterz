import { getFirestore, FieldValue } from "firebase-admin/firestore";

function db() {
  return getFirestore();
}

export async function buildMonthlyGlobalStats(
  rows: {
    winRate: number;
    accuracy: number;
    avgPrecision: number;
    avgUpset: number;
    posts: number;
  }[],
  month: string
) {
  if (rows.length === 0) return;

  const MIN_POSTS_TOP = 30;

  const avg = (arr: number[]) =>
    arr.reduce((a, b) => a + b, 0) / arr.length;

  const [year, mm] = month.split("-");
  const start = new Date(`${year}-${mm}-01T00:00:00+09:00`);
  const end = new Date(
    new Date(start.getFullYear(), start.getMonth() + 1, 0).setHours(
      23,
      59,
      59,
      999
    )
  );

  // === NBA 総試合数 ===
  const totalGamesSnap = await db()
    .collection("games")
    .where("league", "==", "nba")
    .where("resultComputedAtV2", ">=", start)
    .where("resultComputedAtV2", "<=", end)
    .get();

  const totalGames = totalGamesSnap.size;

  // === アップセット試合数 ===
  const upsetGamesSnap = await db()
    .collection("games")
    .where("league", "==", "nba")
    .where("upsetMeta", "!=", null)
    .where("resultComputedAtV2", ">=", start)
    .where("resultComputedAtV2", "<=", end)
    .get();

  const totalUpsetGames = upsetGamesSnap.size;

  const top10Of = (arr: any[]) => {
    const n = Math.max(1, Math.floor(arr.length * 0.1));
    return arr.slice(-n);
  };

  const rowsForTop = rows.filter(r => r.posts >= MIN_POSTS_TOP);

  const byWinRate = [...rowsForTop].sort((a, b) => a.winRate - b.winRate);
  const byAccuracy = [...rowsForTop].sort((a, b) => a.accuracy - b.accuracy);
  const byPrecision = [...rowsForTop].sort(
    (a, b) => a.avgPrecision - b.avgPrecision
  );
  const byUpset = [...rowsForTop].sort((a, b) => a.avgUpset - b.avgUpset);
  const byVolume = [...rows].sort((a, b) => a.posts - b.posts);

  const doc = {
    month,
    upset: {
      totalGames: totalUpsetGames, // アップセットが起きた試合数
      allGames: totalGames,        // NBA 総試合数
      rate: totalGames > 0 ? totalUpsetGames / totalGames : 0, // 発生率
    },
    avg: {
      winRate: avg(rows.map(r => r.winRate)),
      accuracy: avg(rows.map(r => r.accuracy)),
      precision: avg(rows.map(r => r.avgPrecision)),
      upset: avg(rows.map(r => r.avgUpset)),
      volume: avg(rows.map(r => r.posts)),
    },
    top10: {
      winRate: avg(top10Of(byWinRate).map(r => r.winRate)),
      accuracy: avg(top10Of(byAccuracy).map(r => r.accuracy)),
      precision: avg(top10Of(byPrecision).map(r => r.avgPrecision)),
      upset: avg(top10Of(byUpset).map(r => r.avgUpset)),
      volume: avg(top10Of(byVolume).map(r => r.posts)),
    },
    users: rows.length,
    top10EligibleUsers: rowsForTop.length,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db()
    .collection("monthly_global_stats_v2")
    .doc(month)
    .set(doc);
}
