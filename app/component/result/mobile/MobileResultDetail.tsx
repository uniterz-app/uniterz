// app/component/result/mobile/MobileResultDetail.tsx
"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";

import MobileResultMatchHeader from "@/app/component/result/mobile/MobileResultMatchHeader";
import MobileResultMarketCard from "@/app/component/result/mobile/MobileResultMarketCard";
import MobileResultStatsCard from "@/app/component/result/mobile/MobileResultStatsCard";
import ResultPointsDistributionCard from "@/app/component/result/ResultPointsDistributionCard";
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
  pointsDistribution?: GamePointsDistributionV1 | null;
  language?: Language;
  inOverlay?: boolean;
};

export default function MobileResultDetail({
  post,
  market,
  pointsDistribution,
  language = "ja",
  inOverlay = false,
}: Props) {
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
          ? "min-h-0 bg-transparent px-0 py-0"
          : "min-h-screen bg-linear-to-br from-[#0b1220] via-[#0f172a] to-[#111827] px-4 py-4",
      ].join(" ")}
    >
      <React.Fragment key={post.id}>
        <motion.div {...fadeUp(E.delayHeader)}>
          <MobileResultMatchHeader post={post} language={language} inOverlay={inOverlay} />
        </motion.div>

        <div className="mt-4 space-y-4">
          <motion.div {...fadeUp(E.delayMarket)}>
            <MobileResultMarketCard
              post={post}
              market={market}
              inOverlay={inOverlay}
              donutDrawDelayMs={donutDelay}
            />
          </motion.div>
          <motion.div {...fadeUp(E.delayDistribution)}>
            <ResultPointsDistributionCard
              post={post}
              distribution={pointsDistribution}
              language={language}
              inOverlay={inOverlay}
              compact
            />
          </motion.div>
          <motion.div {...fadeUp(E.delayStats)}>
            <MobileResultStatsCard
              post={post}
              minHeightClassName="min-h-[360px]"
              language={language}
              inOverlay={inOverlay}
            />
          </motion.div>
        </div>
      </React.Fragment>
    </div>
  );
}
