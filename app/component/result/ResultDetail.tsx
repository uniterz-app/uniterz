// app/component/result/ResultDetail.tsx
"use client";

import React from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import ResultMatchHeader from "@/app/component/result/ResultMatchHeader";
import ResultMarketCard from "@/app/component/result/ResultMarketCard";
import ResultStatsCard from "@/app/component/result/ResultStatsCard";
import { usePathname } from "next/navigation";
import type { Language } from "@/lib/i18n/language";

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
  language?: Language;
  /** 一覧オーバーレイ内（試合の予想オーバーレイと同じガラス＋透過背景用） */
  inOverlay?: boolean;
};

export default function ResultDetail({
  post,
  market,
  language = "ja",
  inOverlay = false,
}: Props) {
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile");

  return (
    <div
      className={[
        "text-white",
        inOverlay
          ? "min-h-0 bg-transparent"
          : "min-h-screen bg-linear-to-br from-[#0b1220] via-[#0f172a] to-[#111827]",
        inOverlay
          ? "px-0 py-0"
          : isMobile
            ? "px-4 py-4"
            : "p-6",
      ].join(" ")}
    >
      <ResultMatchHeader post={post} language={language} inOverlay={inOverlay} />

      <div
        className={[
          "grid grid-cols-1",
          isMobile ? "gap-4 mt-4" : "md:grid-cols-2 gap-8 mt-10",
        ].join(" ")}
      >
        <ResultMarketCard post={post} market={market} inOverlay={inOverlay} />
        <ResultStatsCard
          post={post}
          minHeightClassName={isMobile ? "min-h-[360px]" : "min-h-[480px]"}
          language={language}
          inOverlay={inOverlay}
        />
      </div>
    </div>
  );
}