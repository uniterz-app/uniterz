"use client";

import { Trophy, TrendingUp } from "lucide-react";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import WcBracketChampionMarket from "@/app/component/predict/market/WcBracketChampionMarket";
import WcBracketTeamProgressMarket from "@/app/component/predict/market/WcBracketTeamProgressMarket";
import useWcBracketMarket from "@/lib/leaderboards/useWcBracketMarket";
import { nameBebas } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type Props = {
  season: string;
  language: Language;
};

export default function WcBracketMarket({ season, language }: Props) {
  const { loading, market } = useWcBracketMarket({ season });
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
      <div className={`${CYBER_GLASS_PANEL} px-4 py-3 text-center text-white`}>
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
          style={PROFILE_SHELL_GRID_STYLE}
          aria-hidden
        />
        <div className="relative z-1">
          <p className="text-[11px] tracking-[0.2em] text-white/55">
            {isJa ? "提出ブラケット" : "SUBMITTED BRACKETS"}
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums text-cyan-300">
            {market.totalEntries}
          </p>
        </div>
      </div>

      <section className="p-0">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-300" />
          <h2 className="text-base font-bold">
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
          <TrendingUp className="h-5 w-5 text-emerald-300" />
          <h2 className="text-base font-bold">
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
