"use client";

import RadarChart from "@/app/component/pro/analysis/RadarChart";
import AnalysisTypeCard from "@/app/component/pro/analysis/AnalysisTypeCard";
import PercentileList from "@/app/component/pro/analysis/PercentileList";
import ProTrendCard from "@/app/component/pro/analysis/ProTrendCard";
import MonthlyComparisonCard from "@/app/component/pro/analysis/MonthlyComparisonCard";
import TeamAffinityCard from "@/app/component/pro/analysis/TeamAffinityCard";
import HomeAwayWinRateBar from "@/app/component/pro/analysis/HomeAwayWinRateBar";
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

/* =========================
 * 追加：型定義（★ここだけ追加）
 * ========================= */

type DailyTrendStat = {
  date: string;
  posts: number;
  winRate: number;
  accuracy: number;
  scorePrecision: number;
};

type MonthlyTrendStat = {
  month: string;
  posts: number;
  winRate: number;
  accuracy: number;
  avgPrecision: number;
  avgUpset: number;
};

/* =========================
 * Props
 * ========================= */

type Props = {
  isSample?: boolean;
  month: string;
  months: string[];
  onChangeMonth: (m: string) => void;

  radar: {
    winRate: number;
    accuracy: number;
    precision: number;
    upset: number;
    volume: number;
    upsetValid: boolean; // ★ 追加
  };
  analysisTypeId: any;

  percentiles: {
    winRate: number;
    accuracy: number;
    precision: number;
    upset: number;
    volume: number;
  };

  comparisonRows: any[];
  comparisonUserCount: number;
  comparisonTop10UserCount?: number;

  homeAway: {
    homeRate: number;
    awayRate: number;
  };

  teamAffinity: {
    strong: any[];
    weak: any[];
  };

  dailyTrend: DailyTrendStat[];      // ★ 修正
  monthlyTrend: MonthlyTrendStat[];  // ★ 修正
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
  homeAway,
  teamAffinity,
  dailyTrend,
  monthlyTrend,
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
    <div className="p-4 space-y-4">
      {/* =========================
       * 月セレクタ
       * ========================= */}
      <div className="flex items-center justify-center gap-4">
        <button
          disabled={!prevMonth}
          onClick={() => prevMonth && onChangeMonth(prevMonth)}
          className="text-white/60 disabled:opacity-30"
        >
          ◀
        </button>

        <span className="text-sm font-semibold text-white">
          {month}
        </span>

        <button
          disabled={!nextMonth}
          onClick={() => nextMonth && onChangeMonth(nextMonth)}
          className="text-white/60 disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      {/* =========================
       * 月次スナップショット
       * ========================= */}
      <div className="space-y-4">
        <RadarChart
  value={radar}
/>
         {isSample && <SampleNotice />}
        <AnalysisTypeCard analysisTypeId={analysisTypeId} />
        <PercentileList percentiles={percentiles} />

        {summaries.length > 0 && (
          <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
            <div className="mb-2 text-sm font-semibold text-white">
              今月の傾向サマリー
            </div>
            <ul className="space-y-1">
              {summaries.map((text, i) => (
                <li
                  key={i}
                  className="text-[12px] font-semibold leading-relaxed text-white"
                >
                  • {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
            <div className="mb-2 text-sm font-semibold text-white">
              今月の改善ポイント
            </div>
            <ul className="space-y-1">
              {improvements.map((text, i) => (
                <li
                  key={i}
                  className="text-[12px] font-semibold leading-relaxed text-white"
                >
                  • {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <MonthlyComparisonCard
          monthLabel={month}
          userCount={comparisonUserCount}
          top10UserCount={comparisonTop10UserCount}
          rows={comparisonRows}
        />

        {isSample && <SampleNotice />}


        <HomeAwayWinRateBar
          homeRate={homeAway.homeRate}
          awayRate={homeAway.awayRate}
        />

        <TeamAffinityCard
          strong={teamAffinity.strong}
          weak={teamAffinity.weak}
        />

        {isSample && <SampleNotice />}
      </div>

      {/* 時系列トレンド */}
      <ProTrendCard
        daily={dailyTrend}
        monthly={monthlyTrend}
      />
    </div>
  );
}
