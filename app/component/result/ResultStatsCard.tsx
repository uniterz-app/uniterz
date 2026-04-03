"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { LineChart } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";

type Props = {
  post: PredictionPostV2;
  minHeightClassName?: string;
  language?: Language;
  inOverlay?: boolean;
};

type StatRow = {
  key: "scorePrecision" | "upsetPoints" | "pointsV3";
  label: string;
  desc: string;
  value: number;
  max?: number;
  /** レーティングバー用の上限（未指定なら max） */
  barMax?: number;
  format?: (v: number) => string;
  Icon: React.ComponentType<any>;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export default function ResultStatsCard({
  post,
  minHeightClassName,
  language = "ja",
  inOverlay = false,
}: Props) {
  const isEn = language === "en";

  const fmt1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "--");

  const {
    rows,
    basePoints,
    upsetBonus,
    streakBonus,
    totalPoints,
  }: {
    rows: StatRow[];
    basePoints: number;
    upsetBonus: number;
    streakBonus: number;
    totalPoints: number;
  } = useMemo(() => {
    const scorePrecision = toNumber(post.stats?.scorePrecision, 0);
    const hadUpsetGame = Boolean((post.stats as any)?.hadUpsetGame);
    const upsetPoints = toNumber((post.stats as any)?.upsetPoints, 0);
    const pointsV3 = toNumber((post.stats as any)?.pointsV3, 0);

    const basePoints = toNumber(
      (post.stats as any)?.pointsV3Detail?.basePoints,
      0
    );
    const upsetBonus = toNumber(
      (post.stats as any)?.pointsV3Detail?.upsetBonus,
      0
    );
    const streakBonus = toNumber(
      (post.stats as any)?.pointsV3Detail?.streakBonus,
      0
    );

    return {
      basePoints,
      upsetBonus,
      streakBonus,
      totalPoints: pointsV3,
      rows: [
        {
          key: "scorePrecision",
          label: isEn ? "Score Precision" : "スコア精度",
          desc: isEn
            ? "How close your predicted score is to the actual score (0–10 per match). Higher means you predicted the score more accurately."
            : "予想スコアが実スコアにどれだけ近いか（1試合 0〜10）。高いほどスコアまで当てている。",
          value: scorePrecision,
          max: 10,
          barMax: 10,
          format: (v) => v.toFixed(1),
        },
        {
          key: "upsetPoints",
          label: isEn ? "Upset Points" : "アップセット",
          desc: isEn
            ? "A separate metric (0–10 per match) awarded only when the match is an upset and you correctly predicted it with a minority pick. If conditions aren't met, it's 0."
            : "その試合がアップセット（波乱）だったうえで、あなたが少数派予想で的中したときだけ加点される別指標（1試合 0〜10）。条件を満たさない場合は 0。",
          value: upsetPoints,
          max: 10,
          barMax: 10,
          format: (v) =>
            hadUpsetGame
              ? `${(Math.round(v * 10) / 10).toFixed(1)}`
              : "--",
        },
        {
          key: "pointsV3",
          label: isEn ? "Total Points" : "総合得点",
          desc: isEn
            ? "Overall score: base points determined by correct winner, closeness of the margin, and closeness of total points, plus the upset bonus and win-streak bonus."
            : "勝者的中・点差の近さ・合計得点の近さで決まる基本点に、アップセットボーナスと連勝ボーナスを加えた包括スコア。",
          value: pointsV3,
          /** バーは10点満点表示（ボーナス込みで実数値は10超えうる → バーは満タンで頭打ち） */
          barMax: 10,
          format: (v) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
        },
      ],
    };
  }, [post.stats, isEn]);

  const barAnimateMs = 520;
  const barStaggerMs = 90;

  const shell = inOverlay
    ? `${MATCH_OVERLAY_GLASS_PANEL} p-5`
    : "rounded-2xl border border-white/15 bg-[#050814]/80 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.55)]";

  const showUpsetBonus = upsetBonus > 1e-6;
  const showStreakBonus = streakBonus > 1e-6;

  return (
    <div className={[shell, minHeightClassName ?? "min-h-[320px]"].join(" ")}>
      <div className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
          <LineChart className="h-3 w-3 text-orange-400" />
        </div>
        <span>Performance Stats</span>
      </div>

      <div className="space-y-1">
        {rows.map((r, index) => {
          const cap = r.barMax ?? r.max ?? 1;
          const ratio = cap > 0 ? clamp01(r.value / cap) : 0;
          const display =
            r.format != null ? r.format(r.value) : String(r.value);

          return (
            <div
              key={r.key}
              className="flex items-center gap-2.5 sm:gap-3"
            >
              <div className="flex w-[7.25rem] min-w-0 shrink-0 sm:w-[7.75rem]">
                <span className="truncate text-[12px] font-semibold text-white sm:text-[13px]">
                  {r.label}
                </span>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                animateMs={barAnimateMs}
                delayMs={index * barStaggerMs}
                size="md"
              />

              <div
                className={`w-11 shrink-0 text-right text-[12px] text-white sm:w-12 sm:text-[13px] ${resultStatsMetricNumClass}`}
              >
                {display}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-white/8 bg-white/4 px-3 py-2">
        <p className="text-center text-[11px] font-medium leading-snug text-white/75 sm:text-[12px]">
          <span className="text-white/90">
            {isEn ? "Base points" : "基本点"}{" "}
            <span className={resultStatsMetricNumClass}>{fmt1(basePoints)}</span>
          </span>
          {showUpsetBonus && (
            <>
              <span className="text-white/35"> + </span>
              <span className="text-white/90">
                {isEn ? "Upset bonus" : "UPSETボーナス"}{" "}
                <span className={resultStatsMetricNumClass}>
                  {fmt1(upsetBonus)}
                </span>
              </span>
            </>
          )}
          {showStreakBonus && (
            <>
              <span className="text-white/35"> + </span>
              <span className="text-white/90">
                {isEn ? "Win streak bonus" : "連勝ボーナス"}{" "}
                <span className={resultStatsMetricNumClass}>
                  {fmt1(streakBonus)}
                </span>
              </span>
            </>
          )}
          <span className="text-white/35"> = </span>
          <span className={[resultStatsMetricNumClass, "text-orange-200/95"].join(" ")}>
            {totalPoints.toFixed(1)}
          </span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={`${r.key}-desc`} className="text-[11px] leading-snug sm:text-[12px]">
            <span className="font-semibold text-white/80">{r.label}：</span>
            <span className="text-white/55">{r.desc}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-center">
        <Link
          href="/web/help"
          className="text-[11px] text-cyan-300 underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-200 sm:text-[12px]"
        >
          {isEn
            ? "See scoring logic on the Help page"
            : "得点の計算方法はヘルプページを参照"}
        </Link>
      </div>
    </div>
  );
}
