"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Trophy, Swords, TrendingUp } from "lucide-react";

import PlayoffBracketMarketHeader from "@/app/component/predict/market/PlayoffBracketMarketHeader";
import PlayoffBracketRound1Market from "@/app/component/predict/market/PlayoffBracketRound1Market";
import PlayoffBracketChampionMarket from "@/app/component/predict/market/PlayoffBracketChampionMarket";
import PlayoffBracketTeamProgressMarket from "@/app/component/predict/market/PlayoffBracketTeamProgressMarket";

type MarketCountMap = Record<string, number>;

type TeamProgressMap = {
  R2: MarketCountMap;
  CF: MarketCountMap;
  FINALS: MarketCountMap;
  CHAMPION: MarketCountMap;
};

type MatchupMarketItem = {
  total: number;
  winnerPickCounts: MarketCountMap;
  gamesPickCounts: MarketCountMap;
};

type MatchupMarketMap = Record<string, MatchupMarketItem>;

type Round1SeriesMarketMap = Record<
  string,
  {
    winnerPickCounts: MarketCountMap;
    gamesPickCounts: MarketCountMap;
  }
>;

type PlayoffBracketMarketData = {
  season: string;
  totalEntries: number;
  championPickCounts: MarketCountMap;
  round1SeriesMarkets: Round1SeriesMarketMap;
  teamProgressMarkets: TeamProgressMap;
  matchupMarkets: {
    R2: MatchupMarketMap;
    CF: MatchupMarketMap;
    FINALS: MatchupMarketMap;
  };
};

export default function PlayoffBracketMarket({
  season,
}: {
  season: string;
}) {
  const [market, setMarket] = useState<PlayoffBracketMarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const ref = doc(db, "playoffBracketMarket", season);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setMarket(null);
          return;
        }

        setMarket(snap.data() as PlayoffBracketMarketData);
      } catch (e) {
        console.error("failed to load playoff bracket market", e);
        setMarket(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [season]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl text-white">
        読み込み中...
      </div>
    );
  }

  if (!market) {
    return (
      <div className="mx-auto w-full max-w-5xl text-white">
        マーケットデータがありません
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 text-white">
      <PlayoffBracketMarketHeader
        season={market.season}
        totalEntries={market.totalEntries}
      />

      <section className="p-0">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-300" />
          <h2 className="text-lg font-bold">優勝予想</h2>
        </div>

        <PlayoffBracketChampionMarket
          championPickCounts={market.championPickCounts}
          totalEntries={market.totalEntries}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-300" />
          <h2 className="text-lg font-bold">勝ち上がり予想</h2>
        </div>

<PlayoffBracketTeamProgressMarket
  season={market.season}
  teamProgressMarkets={market.teamProgressMarkets}
  totalEntries={market.totalEntries}
/>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Swords className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-bold">1stラウンド予想</h2>
        </div>

        <PlayoffBracketRound1Market
          season={market.season}
          markets={market.round1SeriesMarkets}
        />
      </section>
    </div>
  );
}