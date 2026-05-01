import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

type TeamDoc = {
  gamesPlayed: number;
  pointsForTotal: number;
  pointsAgainstTotal: number;
  homeGames: number;
  homeWins: number;
  awayGames: number;
  awayWins: number;
  ppgRank?: number;
  papgRank?: number;
  diffRank?: number;
  ofrtgRank?: number;
  dfrtgRank?: number;
  netrtgRank?: number;
  ofrtg?: number;
  dfrtg?: number;
  netrtg?: number;
};

export type PairTeamStatsView = {
  avgFor: number;
  avgAgainst: number;
  diff: number;
  /** ホーム試合での勝率（%）。Web `GameTeamStats` の Home 行と同じ */
  homeWinPct: number;
  /** アウェイ試合での勝率（%） */
  awayWinPct: number;
  homeW: number;
  homeL: number;
  awayW: number;
  awayL: number;
  ofrtg?: number;
  dfrtg?: number;
  netrtg?: number;
  ppgRank?: number;
  papgRank?: number;
  diffRank?: number;
  ofrtgRank?: number;
  dfrtgRank?: number;
  netrtgRank?: number;
};

function buildView(t: TeamDoc): PairTeamStatsView {
  const avgFor = t.gamesPlayed > 0 ? t.pointsForTotal / t.gamesPlayed : 0;
  const avgAgainst = t.gamesPlayed > 0 ? t.pointsAgainstTotal / t.gamesPlayed : 0;
  const homeGames = t.homeGames ?? 0;
  const awayGames = t.awayGames ?? 0;
  const homeWinPct =
    homeGames > 0 ? (100 * (t.homeWins ?? 0)) / homeGames : 0;
  const awayWinPct =
    awayGames > 0 ? (100 * (t.awayWins ?? 0)) / awayGames : 0;
  const homeL = Math.max(0, homeGames - (t.homeWins ?? 0));
  const awayL = Math.max(0, awayGames - (t.awayWins ?? 0));
  const ofrtg =
    typeof t.ofrtg === "number" && Number.isFinite(t.ofrtg) ? t.ofrtg : undefined;
  const dfrtg =
    typeof t.dfrtg === "number" && Number.isFinite(t.dfrtg) ? t.dfrtg : undefined;
  const netrtg =
    typeof t.netrtg === "number" && Number.isFinite(t.netrtg) ? t.netrtg : undefined;
  return {
    avgFor: Number(avgFor.toFixed(1)),
    avgAgainst: Number(avgAgainst.toFixed(1)),
    diff: Number((avgFor - avgAgainst).toFixed(1)),
    homeWinPct,
    awayWinPct,
    homeW: t.homeWins ?? 0,
    homeL,
    awayW: t.awayWins ?? 0,
    awayL,
    ofrtg,
    dfrtg,
    netrtg,
    ppgRank: t.ppgRank,
    papgRank: t.papgRank,
    diffRank: t.diffRank,
    ofrtgRank: t.ofrtgRank,
    dfrtgRank: t.dfrtgRank,
    netrtgRank: t.netrtgRank,
  };
}

/**
 * Web `GameTeamStats` 相当: `teams/{teamId}` を取得して PPG/得失点/NET 等
 */
export function usePairTeamStats(
  homeTeamId: string | null,
  awayTeamId: string | null
): {
  home: PairTeamStatsView | null;
  away: PairTeamStatsView | null;
  loading: boolean;
  error: string | null;
} {
  const [home, setHome] = useState<PairTeamStatsView | null>(null);
  const [away, setAway] = useState<PairTeamStatsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!homeTeamId || !awayTeamId) {
      setHome(null);
      setAway(null);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      getDoc(doc(db, "teams", homeTeamId)),
      getDoc(doc(db, "teams", awayTeamId)),
    ])
      .then(([hSnap, aSnap]) => {
        if (!alive) return;
        if (!hSnap.exists() || !aSnap.exists()) {
          setHome(hSnap.exists() ? buildView(hSnap.data() as TeamDoc) : null);
          setAway(aSnap.exists() ? buildView(aSnap.data() as TeamDoc) : null);
          if (!hSnap.exists() && !aSnap.exists()) {
            setError("team docs missing");
          }
          return;
        }
        setHome(buildView(hSnap.data() as TeamDoc));
        setAway(buildView(aSnap.data() as TeamDoc));
      })
      .catch((e) => {
        if (!alive) return;
        setHome(null);
        setAway(null);
        setError(e?.message ?? "load error");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [homeTeamId, awayTeamId]);

  return { home, away, loading, error };
}
