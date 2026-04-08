// app/component/result/ResultDetail.tsx
"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import ResultMatchHeader from "@/app/component/result/ResultMatchHeader";
import ResultMarketCard from "@/app/component/result/ResultMarketCard";
import ResultPointsDistributionCard from "@/app/component/result/ResultPointsDistributionCard";
import ResultStatsCard from "@/app/component/result/ResultStatsCard";
import { usePathname } from "next/navigation";
import type { Language } from "@/lib/i18n/language";
import type { GamePointsDistributionV1 } from "@/lib/results/gamePointsDistribution";
import { RESULT_DETAIL_ENTRANCE } from "@/app/component/result/resultDetailEntrance";

type Props = {
  post: PredictionPostV2;
  market?: {
    homeRate: number;
    awayRate: number;
    drawRate?: number;
    total?: number;
  };
  /** games.pointsDistribution（無ければチャートはサンプル） */
  pointsDistribution?: GamePointsDistributionV1 | null;
  language?: Language;
  /** 一覧オーバーレイ内（試合の予想オーバーレイと同じガラス＋透過背景用） */
  inOverlay?: boolean;
};

export default function ResultDetail({
  post,
  market,
  pointsDistribution,
  language = "ja",
  inOverlay = false,
}: Props) {
  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile");
  const reduceMotion = useReducedMotion();

  const E = RESULT_DETAIL_ENTRANCE;
  const dur = reduceMotion ? 0 : E.duration;
  const fadeUp = (delaySec: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: E.y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: dur,
      delay: reduceMotion ? 0 : delaySec,
      ease: E.ease,
    },
  });

  const donutDelay = reduceMotion ? 0 : E.donutDrawDelayMs;

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
      <React.Fragment key={post.id}>
        <motion.div {...fadeUp(E.delayHeader)}>
          <ResultMatchHeader post={post} language={language} inOverlay={inOverlay} />
        </motion.div>

        <div
          className={[
            "grid grid-cols-1",
            isMobile ? "gap-4 mt-4" : "md:grid-cols-2 md:gap-8 mt-10 gap-4",
          ].join(" ")}
        >
          <motion.div {...fadeUp(E.delayMarket)}>
            <ResultMarketCard
              post={post}
              market={market}
              inOverlay={inOverlay}
              sideBySideLayout={!isMobile}
              donutDrawDelayMs={donutDelay}
            />
          </motion.div>
          <motion.div {...fadeUp(E.delayDistribution)}>
            <ResultPointsDistributionCard
              post={post}
              distribution={pointsDistribution}
              language={language}
              inOverlay={inOverlay}
              compact={isMobile}
            />
          </motion.div>
          <motion.div
            className={isMobile ? undefined : "md:col-span-2"}
            {...fadeUp(E.delayStats)}
          >
            <ResultStatsCard
              post={post}
              minHeightClassName={isMobile ? "min-h-[360px]" : "min-h-[400px]"}
              language={language}
              inOverlay={inOverlay}
            />
          </motion.div>
        </div>
      </React.Fragment>
    </div>
  );
}
