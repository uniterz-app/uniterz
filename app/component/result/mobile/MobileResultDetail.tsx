// app/component/result/mobile/MobileResultDetail.tsx
"use client";

import React from "react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";

import MobileResultMatchHeader from "@/app/component/result/mobile/MobileResultMatchHeader";
import MobileResultMarketCard from "@/app/component/result/mobile/MobileResultMarketCard";
import MobileResultStatsCard from "@/app/component/result/mobile/MobileResultStatsCard";

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
  language?: Language;
};

export default function MobileResultDetail({
  post,
  market,
  language = "ja",
}: Props) {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b1220] via-[#0f172a] to-[#111827] text-white px-4 py-4">
      {/* 上部：試合カード（mobileサイズ） */}
      <MobileResultMatchHeader post={post} language={language} />

      {/* 下段：縦積み（mobile） */}
      <div className="mt-4 space-y-4">
        <MobileResultMarketCard post={post} market={market} />
        <MobileResultStatsCard
          post={post}
          minHeightClassName="min-h-[360px]"
          language={language}
        />
      </div>
    </div>
  );
}