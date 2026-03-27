// app/component/result/mobile/MobileResultStatsCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { Target, LineChart, Zap, Trophy } from "lucide-react";
import type { Language } from "@/lib/i18n/language";

type Props = {
  post: PredictionPostV2;
  minHeightClassName?: string;
  language?: Language;
};

type StatRow = {
  key: "scorePrecision" | "upsetPoints" | "pointsV3";
  label: string;
  desc: string;
  value: number;
  max?: number;
  format?: (v: number) => string;
  Icon: React.ComponentType<any>;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export default function MobileResultStatsCard({
  post,
  minHeightClassName,
  language = "ja",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const isEn = language === "en";

  const fmt1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : "--");

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
          format: (v) => v.toFixed(1),
          Icon: Target,
        },
        {
          key: "upsetPoints",
          label: isEn ? "Upset Points" : "アップセット得点",
          desc: isEn
            ? "A separate metric (0–10 per match) awarded only when the match is an upset and you correctly predicted it with a minority pick. If conditions aren't met, it's 0."
            : "その試合がアップセット（波乱）だったうえで、あなたが少数派予想で的中したときだけ加点される別指標（1試合 0〜10）。条件を満たさない場合は 0。",
          value: upsetPoints,
          max: 10,
          format: (v) =>
            hadUpsetGame
              ? `${(Math.round(v * 10) / 10).toFixed(1)}`
              : "--",
          Icon: Zap,
        },
        {
          key: "pointsV3",
          label: isEn ? "Total Points" : "総合得点",
          desc: isEn
            ? "Overall score: base points determined by correct winner, closeness of the margin, and closeness of total points, plus the upset bonus and win-streak bonus."
            : "勝者的中・点差の近さ・合計得点の近さで決まる基本点に、アップセットボーナスと連勝ボーナスを加えた包括スコア。",
          value: pointsV3,
          format: (v) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
          Icon: Trophy,
        },
      ],
    };
  }, [post.stats, isEn]);

  const baseDurationMs = 1400;
  const staggerDelayMs = 200;

  return (
    <div
      className={[
        "rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)] text-white",
        minHeightClassName ?? "min-h-[360px]",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
          <LineChart className="h-3 w-3 text-orange-400" />
        </div>
        <span>Performance Stats</span>
      </div>

      <div className="space-y-6">
        {rows.map((r, index) => {
          const ratio =
            typeof r.max === "number" && r.max > 0
              ? clamp01(r.value / r.max)
              : 0;
          const StatIcon = r.Icon;
          const isTotal = r.key === "pointsV3";

          return (
            <div key={r.key}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black">
                    <StatIcon className="h-3 w-3 text-orange-400" />
                  </div>
                  <div className="truncate text-[12px] font-semibold text-white">
                    {r.label}
                  </div>
                </div>

                <div className="shrink-0 tabular-nums text-[12px] font-semibold text-white">
                  {r.format ? r.format(r.value) : r.value}
                  {!isTotal && typeof r.max === "number" && (
                    <span className="text-white/45"> / {r.max}</span>
                  )}
                </div>
              </div>

              {!isTotal && (
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full will-change-[width] transition-[width] ease-out"
                    style={{
                      width: mounted ? `${ratio * 100}%` : "0%",
                      transitionDuration: `${baseDurationMs}ms`,
                      transitionDelay: `${index * staggerDelayMs}ms`,
                      background:
                        "linear-gradient(90deg, #fdba74 0%, #fb923c 40%, #f97316 70%, #c2410c 100%)",
                      boxShadow: mounted
                        ? "0 0 12px rgba(234,88,12,0.32)"
                        : "none",
                    }}
                  />
                </div>
              )}

              {isTotal && (
                <div className="mt-3 rounded-xl border border-orange-400/20 bg-white/5 px-3 py-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold leading-relaxed text-white">
                    <span className="tabular-nums text-white">
                      {isEn ? "Base Points" : "基本点"} {fmt1(basePoints)}
                    </span>
                    <span className="text-white/45">＋</span>
                    <span className="tabular-nums text-white">
                      {isEn ? "Upset Bonus" : "アップセットボーナス"}{" "}
                      {fmt1(upsetBonus)}
                    </span>
                    <span className="text-white/45">＋</span>
                    <span className="tabular-nums text-white">
                      {isEn ? "Win Streak Bonus" : "連勝ボーナス"}{" "}
                      {fmt1(streakBonus)}
                    </span>
                    <span className="text-white/45">＝</span>
                    <span className="tabular-nums text-[13px] font-extrabold text-orange-300">
                      {totalPoints.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-2">
        {rows.map((r) => (
          <div key={`${r.key}-desc`} className="text-[11px] leading-snug">
            <span className="font-semibold text-white/80">{r.label}：</span>
            <span className="text-white/55">{r.desc}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 text-center">
        <Link
          href="/mobile/help"
          className="text-[11px] text-cyan-300 underline decoration-cyan-400/60 underline-offset-2 hover:text-cyan-200"
        >
          {isEn
            ? "See scoring logic on the Help page"
            : "得点の計算方法はヘルプページを参照"}
        </Link>
      </div>
    </div>
  );
}