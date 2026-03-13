// app/component/result/ResultDetail.tsx
"use client";

import React from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import ResultMatchHeader from "@/app/component/result/ResultMatchHeader";
import ResultMarketCard from "@/app/component/result/ResultMarketCard";
import ResultStatsCard from "@/app/component/result/ResultStatsCard";
import { usePathname } from "next/navigation";

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
};

export default function ResultDetail({ post, market }: Props) {
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile");

  return (
    <div
      className={[
        "min-h-screen text-white",
        // 背景は共通でOK
        "bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#111827]",
        // 余白だけモバイルで縮める
        isMobile ? "px-4 py-4" : "p-6",
      ].join(" ")}
    >
      {/* 上部：試合カード */}
      <ResultMatchHeader post={post} />

      {/* 下段 */}
      <div
        className={[
          // モバイルは縦積み固定
          "grid grid-cols-1",
          // webは2カラム
          isMobile ? "gap-4 mt-4" : "md:grid-cols-2 gap-8 mt-10",
        ].join(" ")}
      >
        <ResultMarketCard post={post} market={market} />
        <ResultStatsCard
          post={post}
          // モバイルはmin-heightを消す/小さくする
          minHeightClassName={isMobile ? "min-h-[360px]" : "min-h-[480px]"}
        />
      </div>
    </div>
  );
}