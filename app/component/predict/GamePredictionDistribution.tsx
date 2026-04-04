"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DonutChart from "./DonutChart";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { auth } from "@/lib/firebase";
import { PieChart } from "lucide-react";

type Props = {
  gameId: string;
  league: "nba" | "bj" | "j1" | "pl";
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  variant?: "default" | "predictForm";
  chartReplayKey?: number;
  fallbackMarketBias?: { homePct: number; awayPct: number };
};

type Seg = { label: string; value: number; color: string };

function buildSegments(
  total: number,
  homeCount: number,
  awayCount: number,
  drawCount: number,
  isSoccer: boolean,
  homeName: string,
  awayName: string,
  homeColor: string,
  awayColor: string,
  isEn: boolean
): Seg[] {
  if (total <= 0) return [];
  if (isSoccer) {
    return [
      { label: homeName, value: homeCount / total, color: homeColor },
      {
        label: isEn ? "Draw" : "引き分け",
        value: drawCount / total,
        color: "#9ca3af",
      },
      { label: awayName, value: awayCount / total, color: awayColor },
    ];
  }
  return [
    { label: homeName, value: homeCount / total, color: homeColor },
    { label: awayName, value: awayCount / total, color: awayColor },
  ];
}

function buildFallbackSegments(
  bias: { homePct: number; awayPct: number },
  isSoccer: boolean,
  homeName: string,
  awayName: string,
  homeColor: string,
  awayColor: string,
  isEn: boolean
): Seg[] {
  const h = Math.max(0, bias.homePct);
  const a = Math.max(0, bias.awayPct);
  const s = Math.max(1e-6, h + a);
  if (isSoccer) {
    return [
      { label: homeName, value: h / s, color: homeColor },
      {
        label: isEn ? "Draw" : "引き分け",
        value: 0,
        color: "#9ca3af",
      },
      { label: awayName, value: a / s, color: awayColor },
    ].filter((x) => x.value > 0.001);
  }
  return [
    { label: homeName, value: h / s, color: homeColor },
    { label: awayName, value: a / s, color: awayColor },
  ];
}

export default function GamePredictionDistribution({
  gameId,
  league,
  homeName,
  awayName,
  homeColor,
  awayColor,
  variant = "default",
  chartReplayKey = 0,
  fallbackMarketBias,
}: Props) {
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const isEn = language === "en";
  const [homeCount, setHomeCount] = useState(0);
  const [awayCount, setAwayCount] = useState(0);
  const [drawCount, setDrawCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const q = query(
      collection(db, "posts"),
      where("gameId", "==", gameId),
      where("schemaVersion", "==", 2)
    );

    getDocs(q).then((snap) => {
      if (!alive) return;
      let h = 0;
      let a2 = 0;
      let d = 0;
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const winner = data?.prediction?.winner ?? data?.winner ?? null;
        if (winner === "home") h++;
        else if (winner === "away") a2++;
        else if (winner === "draw") d++;
      });
      setHomeCount(h);
      setAwayCount(a2);
      setDrawCount(d);
    });

    return () => {
      alive = false;
    };
  }, [gameId]);

  const isSoccer = league === "j1" || league === "pl";
  const total = homeCount + awayCount + (isSoccer ? drawCount : 0);
  const sumFb =
    (fallbackMarketBias?.homePct ?? 0) + (fallbackMarketBias?.awayPct ?? 0);
  const hasFallback = sumFb > 0;

  const fromFallback = total === 0 && hasFallback;
  const segments: Seg[] =
    total > 0
      ? buildSegments(
          total,
          homeCount,
          awayCount,
          drawCount,
          isSoccer,
          homeName,
          awayName,
          homeColor,
          awayColor,
          isEn
        )
      : hasFallback && fallbackMarketBias
        ? buildFallbackSegments(
            fallbackMarketBias,
            isSoccer,
            homeName,
            awayName,
            homeColor,
            awayColor,
            isEn
          )
        : [];

  if (total === 0 && !hasFallback) {
    const emptyCls =
      variant === "predictForm"
        ? "py-3 text-center text-xs text-white/60"
        : "rounded-xl border border-white/10 p-4 text-white/70";
    return (
      <div className={emptyCls}>
        {isEn
          ? "No predictions for this game yet."
          : "まだこの試合の予想がありません。"}
      </div>
    );
  }

  if (variant === "predictForm") {
    return (
      <div className="text-white">
        <div className="mb-3 flex items-center justify-center gap-2 md:mb-4">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
            <PieChart className="h-3 w-3 text-orange-400" />
          </div>
          <span className="text-sm font-semibold md:text-base">
            {isEn ? "Market bias" : "市場の偏り"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="shrink-0">
            <DonutChart
              key={`pf-${chartReplayKey}`}
              segments={segments}
              size={176}
              thickness={56}
              ariaLabel={isEn ? "Prediction market share" : "予想の割合"}
            />
          </div>

          <div className="w-full max-w-[280px] space-y-3 text-sm">
            {!fromFallback ? (
              <div className="mb-1 text-center text-[11px] text-white/70">
                {isEn ? "Total predictions: " : "総予想数："}
                <span className="tabular-nums">{total}</span>
              </div>
            ) : (
              <div className="text-center text-[10px] leading-snug text-white/55">
                {isEn
                  ? "No posts yet — showing list market mix."
                  : "まだ投稿がありません。一覧の市場バイアスを表示しています。"}
              </div>
            )}
            {segments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center justify-center gap-3"
              >
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="max-w-[58%] truncate text-xs text-white/85">
                  {seg.label}
                </span>
                <span className="tabular-nums text-white/70">
                  {(seg.value * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 text-white">
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-10">
        <div className="shrink-0">
          <div className="md:hidden">
            <DonutChart segments={segments} size={140} thickness={50} />
          </div>
          <div className="hidden md:block">
            <DonutChart segments={segments} size={260} thickness={80} />
          </div>
        </div>

        <div className="space-y-3 text-sm md:space-y-4 md:text-base">
          <div className="mb-2 text-center text-xs text-white/70 md:text-left md:text-sm">
            {isEn ? "Total predictions: " : "総分析数："}
            <span className="tabular-nums">{total}</span>
          </div>

          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: homeColor }}
            />
            <span className="whitespace-nowrap">{homeName}</span>
            <span className="tabular-nums">
              {((homeCount / total) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: awayColor }}
            />
            <span className="whitespace-nowrap">{awayName}</span>
            <span className="tabular-nums">
              {((awayCount / total) * 100).toFixed(1)}%
            </span>
          </div>

          {isSoccer && (
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span className="h-3 w-3 rounded-sm bg-gray-400" />
              <span className="whitespace-nowrap">
                {isEn ? "Draw" : "引き分け"}
              </span>
              <span className="tabular-nums">
                {((drawCount / total) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
