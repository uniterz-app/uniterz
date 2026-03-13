"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { Target, LineChart, Zap, Trophy } from "lucide-react";

type Props = {
  post: PredictionPostV2;
  minHeightClassName?: string;
};

type StatRow = {
  key: "scorePrecision" | "probAccuracy" | "upsetPoints" | "pointsV3";
  label: string;
  desc: string;
  value: number;
  max: number;
  format?: (v: number) => string;
  Icon: React.ComponentType<any>;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function ResultStatsCard({ post, minHeightClassName }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows: StatRow[] = useMemo(() => {
    const scorePrecision =
      typeof post.stats?.scorePrecision === "number"
        ? post.stats.scorePrecision
        : 0;

    const upsetPoints =
      typeof (post.stats as any)?.upsetPoints === "number"
        ? (post.stats as any).upsetPoints
        : 0;

    const pointsV3 =
      typeof (post.stats as any)?.pointsV3 === "number"
        ? (post.stats as any).pointsV3
        : 0;

    const brierRaw =
      typeof (post.stats as any)?.brier === "number"
        ? (post.stats as any).brier
        : null;

    const probAccuracy =
      typeof brierRaw === "number" ? clamp01(1 - brierRaw) * 100 : 0;

    return [
      {
        key: "scorePrecision",
        label: "スコア精度",
        desc:
          "予想スコアが実スコアにどれだけ近いか（1試合 0〜10）。高いほど「スコアまで当てている」。",
        value: scorePrecision,
        max: 10,
        format: (v) => v.toFixed(1),
        Icon: Target,
      },
      {
        key: "probAccuracy",
        label: "確率精度",
        desc:
          "自信度 p と結果 y（勝ち=1, 負け=0）で算出。brier=(p−y)^2、確率精度=(1−brier)×100（100%が最高）。",
        value: probAccuracy,
        max: 100,
        format: (v) => `${Math.round(v)}%`,
        Icon: LineChart,
      },
      {
        key: "upsetPoints",
        label: "アップセット得点",
        desc:
          "その試合がアップセット（波乱）だったうえで、あなたが少数派の予想で的中したときだけ加点（1試合 0〜10）。条件を満たさない場合は 0。",
        value: upsetPoints,
        max: 10,
        format: (v) => `${Math.round(v)}`,
        Icon: Zap,
      },
      {
        key: "pointsV3",
        label: "総合得点",
        desc:
          "勝者的中・点差/合計点の近さ・（条件付き）アップセット要素まで含めて評価する包括スコア（1試合 0〜10）。スコア精度＋アップセット得点の単純合算ではない。",
        value: pointsV3,
        max: 10,
        format: (v) => `${Math.round(v)}`,
        Icon: Trophy,
      },
    ];
  }, [post.stats]);

  const baseDurationMs = 1600;
  const staggerDelayMs = 240;

  return (
    <div
      className={[
        "rounded-2xl border border-white/15 bg-[#050814]/80 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.55)]",
        minHeightClassName ?? "min-h-[480px]",
      ].join(" ")}
    >
      <div className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center">
          <LineChart className="h-3 w-3 text-orange-400" />
        </div>
        <span>Performance Stats</span>
      </div>

      <div className="space-y-10">
        {rows.map((r, index) => {
          const ratio = r.max > 0 ? clamp01(r.value / r.max) : 0;
          const StatIcon = r.Icon;

          return (
            <div key={r.key}>
              <div className="flex items-end justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-5 w-5 rounded-full bg-black flex items-center justify-center shrink-0">
                    <StatIcon className="h-3 w-3 text-orange-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {r.label}
                  </div>
                </div>

                <div className="tabular-nums text-sm font-semibold text-white">
                  {r.format ? r.format(r.value) : r.value}
                  <span className="text-white/45"> / {r.max}</span>
                </div>
              </div>

              {/* ★ 少しだけ細く（h-4 → h-3） */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full transition-[width] ease-out will-change-[width]"
                  style={{
                    width: mounted ? `${ratio * 100}%` : "0%",
                    transitionDuration: `${baseDurationMs}ms`,
                    transitionDelay: `${index * staggerDelayMs}ms`,
                    // ★ 円グラフと質感統一（3段階グラデーション）
                    background:
                      "linear-gradient(90deg, #fed7aa 0%, #fb923c 45%, #ea580c 100%)",
                    boxShadow: mounted
                      ? "0 0 14px rgba(249,115,22,0.35)"
                      : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-3">
        {rows.map((r) => (
          <div key={`${r.key}-desc`} className="text-[12px] leading-snug">
            <span className="font-semibold text-white/80">
              {r.label}：
            </span>
            <span className="text-white/55">{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}