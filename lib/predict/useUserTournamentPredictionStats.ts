"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import type { PredictSelfStats } from "@/lib/predict/buildPredictProInfo";

const MAX_POSTS = 300;

function emptyStats(): PredictSelfStats {
  return {
    raw: { posts: 0, wins: 0 },
    homeAway: {
      home: { posts: 0, wins: 0 },
      away: { posts: 0, wins: 0 },
    },
    market: { underdogPickCount: 0, underdogWins: 0 },
    teams: {},
  };
}

/** 自分の確定済み予想投稿（league 単位）を集計して Pro Info 用の自己傾向を返す */
export function useUserTournamentPredictionStats(input: {
  uid?: string | null;
  league: League;
  enabled?: boolean;
}): { stats: PredictSelfStats | null; loading: boolean } {
  const { uid, league } = input;
  const enabled = input.enabled !== false && Boolean(uid);
  const [stats, setStats] = useState<PredictSelfStats | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !uid) {
      setStats(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    void (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "posts"),
            where("authorUid", "==", uid),
            where("league", "==", league),
            orderBy("createdAt", "desc"),
            limit(MAX_POSTS)
          )
        );
        if (!alive) return;

        const agg = emptyStats();

        for (const docSnap of snap.docs) {
          const p = docSnap.data() as Record<string, any>;
          const pick: "home" | "away" | "draw" | undefined =
            p.prediction?.winner;
          const isWinRaw = p.stats?.isWin;
          if (isWinRaw !== true && isWinRaw !== false) continue; // 未確定は除外
          const isWin = isWinRaw === true;

          agg.raw.posts += 1;
          if (isWin) agg.raw.wins += 1;

          if (pick === "home" || pick === "away") {
            const bucket = agg.homeAway[pick];
            bucket.posts += 1;
            if (isWin) bucket.wins += 1;

            const teamId =
              pick === "home" ? p.home?.teamId : p.away?.teamId;
            if (teamId) {
              agg.teams[teamId] ??= { posts: 0, wins: 0 };
              agg.teams[teamId].posts += 1;
              if (isWin) agg.teams[teamId].wins += 1;
            }
          }

          const majoritySide = p.marketMeta?.majoritySide;
          if (majoritySide && pick && pick !== majoritySide) {
            agg.market.underdogPickCount += 1;
            if (isWin) agg.market.underdogWins += 1;
          }
        }

        setStats(agg);
      } catch {
        if (alive) setStats(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [enabled, uid, league]);

  return { stats, loading };
}
