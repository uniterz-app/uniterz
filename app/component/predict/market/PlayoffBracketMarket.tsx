"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Trophy, Swords, TrendingUp } from "lucide-react";

import PlayoffBracketMarketHeader from "@/app/component/predict/market/PlayoffBracketMarketHeader";
import PlayoffBracketRound1Market from "@/app/component/predict/market/PlayoffBracketRound1Market";
import PlayoffBracketChampionMarket from "@/app/component/predict/market/PlayoffBracketChampionMarket";
import PlayoffBracketTeamProgressMarket from "@/app/component/predict/market/PlayoffBracketTeamProgressMarket";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";
import { nameBebas } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";

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

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const { language } = useUserLanguage(uid);
  const isEn = language === "en";

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
        {isEn ? "Loading..." : "読み込み中..."}
      </div>
    );
  }

  if (!market) {
    return (
      <div
        role="status"
        className="mx-auto flex min-h-[70dvh] w-full max-w-5xl items-center justify-center px-4 text-white"
      >
        <p
          className={[
            nameBebas.className,
            "text-center text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
          ].join(" ")}
          style={cyberNoDataLabelStyle}
        >
          NO DATA
        </p>
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
          <h2 className="text-lg font-bold">
            {isEn ? "Champion Predictions" : "優勝予想"}
          </h2>
        </div>

        <PlayoffBracketChampionMarket
          championPickCounts={market.championPickCounts}
          totalEntries={market.totalEntries}
          language={language as Language}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-300" />
          <h2 className="text-lg font-bold">
            {isEn ? "Advancement Predictions" : "勝ち上がり予想"}
          </h2>
        </div>

        <PlayoffBracketTeamProgressMarket
          season={market.season}
          teamProgressMarkets={market.teamProgressMarkets}
          totalEntries={market.totalEntries}
          language={language as Language}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Swords className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-bold">
            {isEn ? "Round 1 Predictions" : "1stラウンド予想"}
          </h2>
        </div>

        <PlayoffBracketRound1Market
          season={market.season}
          markets={market.round1SeriesMarkets}
        />
      </section>
    </div>
  );
}