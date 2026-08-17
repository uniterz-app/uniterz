"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n/t";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { useGamePointsSummaryStats } from "@/lib/hooks/useGamePointsSummaryStats";

type Props = {
  gameId: string;
  league: "nba" | "bj" | "j1" | "pl" | "wc";
  knockout?: boolean;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  variant?: "default" | "predictForm";
  chartReplayKey?: number;
  fallbackMarketBias?: { homePct: number; awayPct: number };
  /** @deprecated posts 分布は廃止 */
  distribution?: unknown;
  distributionLoading?: boolean;
  /** 自分の pointsV3（確定後） */
  myScore?: number | null;
};

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return (Math.round(n * 10) / 10).toFixed(1);
}

/**
 * 勝敗％ドーナツは廃止。
 * 試合確定後の平均・中央値・最高・自分の得点を表示（games.pointsDistribution）。
 */
export default function GamePredictionDistribution({
  gameId,
  variant = "default",
  myScore = null,
}: Props) {
  const pathname = usePathname() ?? "";
  const web =
    !(pathname.startsWith("/mobile") || pathname.startsWith("/m/")) &&
    variant !== "predictForm";
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const m = t(language);
  const stats = useGamePointsSummaryStats({
    gameId,
    enabled: Boolean(gameId),
    myScore,
  });

  const labels =
    language === "ja"
      ? {
          title: "得点サマリー",
          mean: "平均",
          median: "中央値",
          max: "最高",
          mine: "自分",
          pending: "試合確定後に表示",
        }
      : {
          title: "Points summary",
          mean: "Avg",
          median: "Median",
          max: "Max",
          mine: "You",
          pending: "Available after final",
        };

  const cells = [
    { key: "mean", label: labels.mean, value: stats.mean },
    { key: "median", label: labels.median, value: stats.median },
    { key: "max", label: labels.max, value: stats.max },
    { key: "mine", label: labels.mine, value: stats.myScore },
  ] as const;

  const hasData = stats.n > 0 && (stats.mean != null || stats.median != null);

  return (
    <div
      className={[
        "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3",
        web ? "max-w-[420px]" : "",
      ].join(" ")}
    >
      <div
        className={[
          "mb-2 text-center font-semibold text-white/80",
          web ? "text-sm" : "text-xs",
        ].join(" ")}
      >
        {labels.title}
      </div>
      {!stats.ready ? (
        <div className="py-4 text-center text-xs text-white/50">…</div>
      ) : !hasData ? (
        <div className="py-3 text-center text-xs text-white/50">
          {labels.pending}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cells.map((c) => (
            <div key={c.key} className="text-center">
              <div
                className={[
                  "text-white/55",
                  web ? "text-[11px]" : "text-[10px]",
                ].join(" ")}
              >
                {c.label}
              </div>
              <div
                className={[
                  resultStatsMetricNumClass,
                  "mt-0.5 font-bold text-white",
                  web ? "text-lg" : "text-base",
                ].join(" ")}
              >
                {fmt(c.value)}
              </div>
            </div>
          ))}
        </div>
      )}
      {hasData && stats.n > 0 ? (
        <div className="mt-2 text-center text-[10px] text-white/40">
          {m.predict.totalPredictions}
          <span className={resultStatsMetricNumClass}>{stats.n}</span>
        </div>
      ) : null}
    </div>
  );
}
