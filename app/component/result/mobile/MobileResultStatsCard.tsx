// app/component/result/mobile/MobileResultStatsCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { Target, LineChart, Zap, Trophy } from "lucide-react";

type Props = {
  post: PredictionPostV2;
  minHeightClassName?: string;
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
}: Props) {
  const [mounted, setMounted] = useState(false);

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
          label: "スコア精度",
          desc:
            "予想スコアが実スコアにどれだけ近いか（1試合 0〜10）。高いほどスコアまで当てている。",
          value: scorePrecision,
          max: 10,
          format: (v) => v.toFixed(1),
          Icon: Target,
        },
        {
          key: "upsetPoints",
          label: "アップセット得点",
          desc:
            "その試合がアップセット（波乱）だったうえで、あなたが少数派予想で的中したときだけ加点される別指標（1試合 0〜10）。条件を満たさない場合は 0。",
          value: upsetPoints,
          max: 10,
          format: (v) => `${Math.round(v)}`,
          Icon: Zap,
        },
        {
          key: "pointsV3",
          label: "総合得点",
          desc:
            "勝者的中・点差の近さ・合計得点の近さで決まる基本点に、アップセットボーナスと連勝ボーナスを加えた包括スコア。",
          value: pointsV3,
          format: (v) => `${Math.round(v)}`,
          Icon: Trophy,
        },
      ],
    };
  }, [post.stats]);

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
                      基本点 {basePoints}
                    </span>
                    <span className="text-white/45">＋</span>
                    <span className="tabular-nums text-white">
                      Upsetボーナス {upsetBonus}
                    </span>
                    <span className="text-white/45">＋</span>
                    <span className="tabular-nums text-white">
                      連勝ボーナス {streakBonus}
                    </span>
                    <span className="text-white/45">＝</span>
                    <span className="tabular-nums text-[13px] font-extrabold text-orange-300">
                      {totalPoints}
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
    </div>
  );
}