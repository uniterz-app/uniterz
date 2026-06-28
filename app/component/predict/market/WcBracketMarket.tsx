"use client";

import { Swords, Trophy, TrendingUp } from "lucide-react";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import WcBracketChampionMarket from "@/app/component/predict/market/WcBracketChampionMarket";
import WcBracketMatchupMarket from "@/app/component/predict/market/WcBracketMatchupMarket";
import WcBracketTeamProgressMarket from "@/app/component/predict/market/WcBracketTeamProgressMarket";
import useWcBracketMarket from "@/lib/leaderboards/useWcBracketMarket";
import { useWcKnockoutAdvancement } from "@/lib/wc/useWcKnockoutAdvancement";
import { alfa, nameBebas } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  season: string;
  language: Language;
};

export default function WcBracketMarket({ season, language }: Props) {
  const { loading, market } = useWcBracketMarket({ season });
  const { advancement } = useWcKnockoutAdvancement(season);
  const m = t(language);
  const isJa = language === "ja";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <CandleChartLoader label={m.common.loading} />
      </div>
    );
  }

  if (!market || market.totalEntries === 0) {
    return (
      <div
        role="status"
        className="flex min-h-[min(40dvh,360px)] flex-col items-center justify-center px-4 text-center"
      >
        <p
          className={[
            nameBebas.className,
            "text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
          ].join(" ")}
          style={cyberNoDataLabelStyle}
        >
          NO DATA
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-bottom-nav pt-1">
      <div className="wc-bracket-user-card relative px-4 py-3 text-center text-white">
        <div className="relative z-10">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-white/50">
            {isJa ? "提出ブラケット" : "SUBMITTED BRACKETS"}
          </p>
          <p
            className={[
              "mt-1 text-[32px] font-black tabular-nums leading-none text-[#00F5FF]",
              alfa.className,
            ].join(" ")}
          >
            {market.totalEntries}
          </p>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-4 w-4 text-amber-300/90" strokeWidth={2.2} />
          <h2
            className={[
              nameBebas.className,
              "text-[15px] tracking-[0.1em] text-white/90",
            ].join(" ")}
          >
            {m.predict.championPredictions}
          </h2>
        </div>
        <WcBracketChampionMarket
          championPickCounts={market.championPickCounts}
          totalEntries={market.totalEntries}
          language={language}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Swords className="h-4 w-4 text-cyan-300/90" strokeWidth={2.2} />
          <h2
            className={[
              nameBebas.className,
              "text-[15px] tracking-[0.1em] text-white/90",
            ].join(" ")}
          >
            {isJa ? "対戦予想" : "MATCH PREDICTIONS"}
          </h2>
        </div>
        <WcBracketMatchupMarket
          entries={market.matchupMarkets}
          advancement={advancement}
          language={language}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp
            className="h-4 w-4 text-[#00F5FF]/90"
            strokeWidth={2.2}
          />
          <h2
            className={[
              nameBebas.className,
              "text-[15px] tracking-[0.1em] text-white/90",
            ].join(" ")}
          >
            {m.predict.advancementPredictions}
          </h2>
        </div>
        <WcBracketTeamProgressMarket
          teamProgressMarkets={market.teamProgressMarkets}
          totalEntries={market.totalEntries}
          language={language}
        />
      </section>
    </div>
  );
}
