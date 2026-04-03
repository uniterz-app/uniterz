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
  inOverlay?: boolean;
};

export default function MobileResultDetail({
  post,
  market,
  language = "ja",
  inOverlay = false,
}: Props) {
  return (
    <div
      className={[
        "text-white",
        inOverlay
          ? "min-h-0 bg-transparent px-0 py-0"
          : "min-h-screen bg-linear-to-br from-[#0b1220] via-[#0f172a] to-[#111827] px-4 py-4",
      ].join(" ")}
    >
      <MobileResultMatchHeader post={post} language={language} inOverlay={inOverlay} />

      <div className="mt-4 space-y-4">
        <MobileResultMarketCard post={post} market={market} inOverlay={inOverlay} />
        <MobileResultStatsCard
          post={post}
          minHeightClassName="min-h-[360px]"
          language={language}
          inOverlay={inOverlay}
        />
      </div>
    </div>
  );
}