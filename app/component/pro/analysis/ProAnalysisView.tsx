"use client";

import RadarChart from "@/app/component/pro/analysis/RadarChart";
import AnalysisTypeCard from "@/app/component/pro/analysis/AnalysisTypeCard";
import PercentileList from "@/app/component/pro/analysis/PercentileList";
import MonthlyComparisonCard from "@/app/component/pro/analysis/MonthlyComparisonCard";
import TeamAffinityCard from "@/app/component/pro/analysis/TeamAffinityCard";
import HomeAwayWinRateBar from "@/app/component/pro/analysis/HomeAwayWinRateBar";
import type { AnalysisTypeId } from "@/shared/analysis/types";
import MarketBiasBars from "@/app/component/pro/analysis/MarketBiasSemiDonut";
import StreakSummaryWithComment from "@/app/component/pro/analysis/StreakSummaryWithComment";
import AnalysisStyleMap from "@/app/component/pro/analysis/AnalysisStyleMap";

import {
  buildMonthlySummary,
  buildMonthlyImprovement,
} from "@/app/component/pro/analysis/summaryRules";

function SampleNotice() {
  return (
    <div className="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300">
      ※ これはサンプルデータです
    </div>
  );
}

type Props = {
  isSample?: boolean;
  month: string;
  months: string[];
  onChangeMonth: (m: string) => void;

  radar: {
    winRate: number;
    precision: number;
    upset: number;
    volume: number;
    streak: number;
    upsetValid: boolean;
  };

  analysisTypeId: AnalysisTypeId;

  percentiles: {
    winRate: number;
    precision: number;
    pointsV3: number;
    upset: number;
    volume: number;
  };

  comparisonRows: any[];
  comparisonUserCount: number;
  comparisonTop10UserCount?: number;

  styleMapPoints: {
    homeAwayBias: number;
    marketBias: number;
    winRate: number;
    key?: string;
  }[];

  streak: {
    maxWin: number;
    maxLose: number;
  };

  prevStreak?: {
    maxWin: number;
    maxLose: number;
  };

  homeAway: {
    homeRate: number;
    awayRate: number;
    homeShare: number;
    awayShare: number;
  };

  marketBias: {
    favorableWinRate: number;
    contrarianWinRate: number;
    favorableShare: number;
    contrarianShare: number;
  };

  teamAffinity: {
    strong: any[];
    weak: any[];
  };
};

export default function ProAnalysisView({
  isSample,
  month,
  months,
  onChangeMonth,
  radar,
  analysisTypeId,
  percentiles,
  comparisonRows,
  comparisonUserCount,
  comparisonTop10UserCount,
  streak,
  prevStreak,
  styleMapPoints,
  homeAway,
  marketBias,
  teamAffinity,
}: Props) {
  const summaries = buildMonthlySummary({
    month,
    percentiles,
  });

  const improvements = buildMonthlyImprovement({
    month,
    percentiles,
  });

  const currentMonthIndex = months.indexOf(month);

  const prevMonth =
    currentMonthIndex > 0 ? months[currentMonthIndex - 1] : null;

  const nextMonth =
    currentMonthIndex < months.length - 1
      ? months[currentMonthIndex + 1]
      : null;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-center gap-4">
        <button
          disabled={!prevMonth}
          onClick={() => prevMonth && onChangeMonth(prevMonth)}
          className="text-white/60 disabled:opacity-30"
        >
          ◀
        </button>

        <span className="text-sm font-semibold text-white">{month}</span>

        <button
          disabled={!nextMonth}
          onClick={() => nextMonth && onChangeMonth(nextMonth)}
          className="text-white/60 disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      {isSample && <SampleNotice />}

      <div className="space-y-4">
        {/* 1段目: レーダー + 分析タイプ */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <RadarChart value={radar} />
          <AnalysisTypeCard analysisTypeId={analysisTypeId} />
        </div>

        {isSample && <SampleNotice />}

        {/* 2段目: パーセンタイル + 月間比較 */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <PercentileList percentiles={percentiles} />

          <MonthlyComparisonCard
            monthLabel={month}
            userCount={comparisonUserCount}
            top10UserCount={comparisonTop10UserCount}
            rows={comparisonRows}
          />
        </div>

        {/* 3段目: 今月の傾向サマリー */}
        {summaries.length > 0 && (
          <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
            <div className="mb-2 text-sm font-semibold text-white md:text-lg">
              今月の傾向サマリー
            </div>

            <ul className="space-y-1">
              {summaries.map((text, i) => (
                <li
                  key={i}
                  className="text-[12px] font-semibold leading-relaxed text-white md:text-[15px]"
                >
                  • {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4段目: 連勝連敗 */}
        <StreakSummaryWithComment
          maxWinStreak={streak.maxWin}
          maxLoseStreak={streak.maxLose}
          lastMaxWinStreak={prevStreak?.maxWin}
          lastMaxLoseStreak={prevStreak?.maxLose}
          periodLabel={month}
        />

        {/* 5段目: Home/Away + 市場傾向 */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <HomeAwayWinRateBar
            homeRate={homeAway.homeRate}
            awayRate={homeAway.awayRate}
            homeShare={homeAway.homeShare}
            awayShare={homeAway.awayShare}
          />

          <MarketBiasBars
            favorableWinRate={marketBias.favorableWinRate}
            contrarianWinRate={marketBias.contrarianWinRate}
            favorableShare={marketBias.favorableShare}
            contrarianShare={marketBias.contrarianShare}
          />
        </div>

        {/* 6段目: 改善ポイント */}
        {improvements.length > 0 && (
          <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
            <div className="mb-2 text-sm font-semibold text-white md:text-lg">
              今月の改善ポイント
            </div>

            <ul className="space-y-1">
              {improvements.map((text, i) => (
                <li
                  key={i}
                  className="text-[12px] font-semibold leading-relaxed text-white md:text-[15px]"
                >
                  • {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isSample && <SampleNotice />}

        <AnalysisStyleMap points={styleMapPoints} />

        <TeamAffinityCard
          strong={teamAffinity.strong}
          weak={teamAffinity.weak}
        />
      </div>
    </div>
  );
}