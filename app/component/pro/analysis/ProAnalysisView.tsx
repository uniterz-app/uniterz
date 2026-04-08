"use client";

import RadarChart from "@/app/component/pro/analysis/RadarChart";
import AnalysisTypeCard from "@/app/component/pro/analysis/AnalysisTypeCard";
import TeamAffinityCard from "@/app/component/pro/analysis/TeamAffinityCard";
import HomeAwayWinRateBar from "@/app/component/pro/analysis/HomeAwayWinRateBar";
import type { AnalysisTypeId } from "@/shared/analysis/types";
import type { RadarAxisLevels } from "@/app/component/pro/analysis/radarLevelUtils";
import MarketBiasBars from "@/app/component/pro/analysis/MarketBiasSemiDonut";
import StreakSummaryWithComment from "@/app/component/pro/analysis/StreakSummaryWithComment";
import AnalysisStyleMap from "@/app/component/pro/analysis/AnalysisStyleMap";

import { buildMonthlyImprovement } from "@/app/component/pro/analysis/summaryRules";
import PrevMonthSummaryCard from "@/app/component/pro/analysis/PrevMonthSummaryCard";
import SummaryCardReveal from "@/app/component/profile/ui/SummaryCardReveal";
import type { Language } from "@/lib/i18n/language";

function SampleNotice() {
  return (
    <div className="rounded-md border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs text-yellow-300">
      ※ これはサンプルデータです
    </div>
  );
}

type Props = {
  isSample?: boolean;
  language?: Language;
  /** 選択月のひとつ前の月のサマリー（先頭カード） */
  prevMonthSummary?: {
    monthKey: string;
    stats: any;
    olderStats: any | null;
  } | null;
  /** 先月サマリー月の総合得点（合計）母集団基準（monthly_global_stats_v2.pointsSumV3Benchmarks） */
  prevMonthPointsSumBenchmarks?: {
    mean: number;
    median: number;
    p90: number;
    max: number;
  } | null;
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
    radarEligible?: boolean;
  };

  /** レーダー各軸の S/M/W（未指定ならチャート右の評価パネルなし） */
  radarAxisLevels?: RadarAxisLevels | null;

  analysisTypeId: AnalysisTypeId;

  percentiles: {
    winRate: number;
    precision: number;
    pointsV3: number;
    upset: number;
    volume: number;
  };

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

  /** Pro Stats タブ入場時のセクション演出（フェードアップ＋ブラー解除） */
  playSectionEntrance?: boolean;
};

export default function ProAnalysisView({
  isSample,
  language = "ja",
  prevMonthSummary,
  prevMonthPointsSumBenchmarks = null,
  month,
  months,
  onChangeMonth,
  radar,
  radarAxisLevels,
  analysisTypeId,
  percentiles,
  streak,
  prevStreak,
  styleMapPoints,
  homeAway,
  marketBias,
  teamAffinity,
  playSectionEntrance = true,
}: Props) {
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

  const hasPrevMonth = !!prevMonthSummary;
  let revealK = hasPrevMonth ? 1 : 0;
  const revealPrev = hasPrevMonth ? 0 : -1;
  const revealRadar = revealK++;
  const revealAnalysis = revealK++;
  const revealStyleMap = revealK++;
  const revealHomeAway = revealK++;
  const revealMarket = revealK++;
  const revealStreak = revealK++;
  const revealTeam = revealK++;
  const revealImprovements =
    improvements.length > 0 ? revealK++ : -1;
  const revealTotal = revealK;

  return (
    <div className="w-full space-y-4 py-4">
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
        {prevMonthSummary ? (
          <SummaryCardReveal
            index={revealPrev}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="w-full"
          >
            <PrevMonthSummaryCard
              language={language}
              summaryMonthKey={prevMonthSummary.monthKey}
              stats={prevMonthSummary.stats}
              olderStats={prevMonthSummary.olderStats}
              pointsSumBenchmarks={prevMonthPointsSumBenchmarks}
            />
          </SummaryCardReveal>
        ) : null}

        {/* 1段目: レーダー + 分析タイプ */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <SummaryCardReveal
            index={revealRadar}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="min-h-0 min-w-0"
          >
            <RadarChart
              value={radar}
              axisLevels={radarAxisLevels ?? undefined}
              language={language}
            />
          </SummaryCardReveal>
          <SummaryCardReveal
            index={revealAnalysis}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="min-h-0 min-w-0"
          >
            <div className="flex min-h-0 min-w-0 flex-col gap-4">
              <AnalysisTypeCard
                key={`${month}-${analysisTypeId}`}
                analysisTypeId={analysisTypeId}
                axisLevels={radarAxisLevels}
              />
              <div className="hidden lg:block">
                <StreakSummaryWithComment
                  maxWinStreak={streak.maxWin}
                  maxLoseStreak={streak.maxLose}
                  lastMaxWinStreak={prevStreak?.maxWin}
                  lastMaxLoseStreak={prevStreak?.maxLose}
                  periodLabel={month}
                />
              </div>
            </div>
          </SummaryCardReveal>
        </div>

        {isSample && <SampleNotice />}

        {/* mobile: 連勝連敗は分析タイプの直下に戻す */}
        <SummaryCardReveal
          index={revealStreak}
          total={revealTotal}
          enabled={playSectionEntrance}
          enterVariant="blurUp"
          className="w-full lg:hidden"
        >
          <StreakSummaryWithComment
            maxWinStreak={streak.maxWin}
            maxLoseStreak={streak.maxLose}
            lastMaxWinStreak={prevStreak?.maxWin}
            lastMaxLoseStreak={prevStreak?.maxLose}
            periodLabel={month}
          />
        </SummaryCardReveal>

        {/* mobile: 従来順に戻す（分析スタイル -> Home/Away -> 市場志向） */}
        <SummaryCardReveal
          index={revealStyleMap}
          total={revealTotal}
          enabled={playSectionEntrance}
          enterVariant="blurUp"
          className="w-full lg:hidden"
        >
          <AnalysisStyleMap points={styleMapPoints} />
        </SummaryCardReveal>

        <SummaryCardReveal
          index={revealHomeAway}
          total={revealTotal}
          enabled={playSectionEntrance}
          enterVariant="blurUp"
          className="w-full lg:hidden"
        >
          <HomeAwayWinRateBar
            homeRate={homeAway.homeRate}
            awayRate={homeAway.awayRate}
            homeShare={homeAway.homeShare}
            awayShare={homeAway.awayShare}
          />
        </SummaryCardReveal>

        <SummaryCardReveal
          index={revealMarket}
          total={revealTotal}
          enabled={playSectionEntrance}
          enterVariant="blurUp"
          className="w-full lg:hidden"
        >
          <MarketBiasBars
            favorableWinRate={marketBias.favorableWinRate}
            contrarianWinRate={marketBias.contrarianWinRate}
            favorableShare={marketBias.favorableShare}
            contrarianShare={marketBias.contrarianShare}
          />
        </SummaryCardReveal>

        {/* web: 現在レイアウトは維持 */}
        <div className="hidden items-stretch gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SummaryCardReveal
            index={revealStyleMap}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="w-full lg:row-span-2"
          >
            <AnalysisStyleMap points={styleMapPoints} />
          </SummaryCardReveal>

          <SummaryCardReveal
            index={revealHomeAway}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="w-full"
          >
            <HomeAwayWinRateBar
              homeRate={homeAway.homeRate}
              awayRate={homeAway.awayRate}
              homeShare={homeAway.homeShare}
              awayShare={homeAway.awayShare}
            />
          </SummaryCardReveal>

          <SummaryCardReveal
            index={revealMarket}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="w-full"
          >
            <MarketBiasBars
              favorableWinRate={marketBias.favorableWinRate}
              contrarianWinRate={marketBias.contrarianWinRate}
              favorableShare={marketBias.favorableShare}
              contrarianShare={marketBias.contrarianShare}
            />
          </SummaryCardReveal>
        </div>

        {/* 次段: チーム別 */}
        <SummaryCardReveal
          index={revealTeam}
          total={revealTotal}
          enabled={playSectionEntrance}
          enterVariant="blurUp"
          className="w-full"
        >
          <TeamAffinityCard
            strong={teamAffinity.strong}
            weak={teamAffinity.weak}
          />
        </SummaryCardReveal>

        {/* 8段目: 改善ポイント */}
        {improvements.length > 0 ? (
          <SummaryCardReveal
            index={revealImprovements}
            total={revealTotal}
            enabled={playSectionEntrance}
            enterVariant="blurUp"
            className="w-full"
          >
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
          </SummaryCardReveal>
        ) : null}

        {isSample && <SampleNotice />}
      </div>
    </div>
  );
}