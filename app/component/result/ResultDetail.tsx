// app/component/result/ResultDetail.tsx
"use client";

import React from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import ResultMatchHeader from "@/app/component/result/ResultMatchHeader";
import ResultMarketCard from "@/app/component/result/ResultMarketCard";
import ResultPointsDistributionCard from "@/app/component/result/ResultPointsDistributionCard";
import ResultStatsCard from "@/app/component/result/ResultStatsCard";
import ResultTopScoresList from "@/app/component/result/ResultTopScoresList";
import { usePathname } from "next/navigation";
import type { Language } from "@/lib/i18n/language";
import type { GamePointsDistributionV1 } from "@/lib/results/gamePointsDistribution";
import type { GamePointsTopEntryV1 } from "@/lib/results/gamePointsTop";
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
  pointsDistributionLoading?: boolean;
  /** この試合の得点上位（games.pointsSummary.top） */
  topEntries?: GamePointsTopEntryV1[] | null;
  language?: Language;
  /** 一覧オーバーレイ内（試合の予想オーバーレイと同じガラス＋透過背景用） */
  inOverlay?: boolean;
  /** 親オーバーレイで MatchCard を表示済みのとき */
  hideMatchHeader?: boolean;
  /** マーケットバイアスカードを出さない */
  hideMarketCard?: boolean;
  /** 閲覧者 UID（自分の投稿時のみヘッダーに予想修正ボタン） */
  viewerUid?: string | null;
  gamesRoutePrefix?: "/web" | "/mobile";
  cardClockMs?: number;
  onRequestPredictEdit?: (post: PredictionPostV2) => void;
};

export default function ResultDetail({
  post,
  market,
  pointsDistribution,
  pointsDistributionLoading = false,
  topEntries = null,
  language = "ja",
  inOverlay = false,
  hideMatchHeader = false,
  hideMarketCard = false,
  viewerUid = null,
  gamesRoutePrefix = "/web",
  cardClockMs,
  onRequestPredictEdit,
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
        inOverlay ? "min-h-0 bg-transparent" : "min-h-screen bg-transparent",
        inOverlay
          ? "px-0 py-0"
          : isMobile
            ? "px-4 py-4"
            : "p-6",
      ].join(" ")}
    >
      <LazyMotion features={domAnimation}>
        <React.Fragment key={post.id}>
          {!hideMatchHeader ? (
            <m.div {...fadeUp(E.delayHeader)}>
              <ResultMatchHeader
                post={post}
                language={language}
                inOverlay={inOverlay}
                viewerUid={viewerUid}
                gamesRoutePrefix={gamesRoutePrefix}
                cardClockMs={cardClockMs}
                onRequestPredictEdit={onRequestPredictEdit}
              />
            </m.div>
          ) : null}

          <div
            className={
              hideMatchHeader && inOverlay
                ? "mt-0 flex flex-col gap-0"
                : [
                    "grid grid-cols-1",
                    hideMatchHeader
                      ? isMobile
                        ? "mt-0 gap-4"
                        : "mt-0 gap-4 md:grid-cols-2 md:gap-8"
                      : isMobile
                        ? "mt-4 gap-4"
                        : "mt-10 gap-4 md:grid-cols-2 md:gap-8",
                  ].join(" ")
            }
          >
            {!hideMarketCard ? (
              <m.div {...fadeUp(E.delayMarket)}>
                <ResultMarketCard
                  post={post}
                  market={market}
                  inOverlay={inOverlay}
                  sideBySideLayout={!isMobile}
                  donutDrawDelayMs={donutDelay}
                />
              </m.div>
            ) : null}
            <m.div
              {...fadeUp(E.delayDistribution)}
              data-tutorial-target="result-detail-more"
            >
              <ResultPointsDistributionCard
                post={post}
                distribution={pointsDistribution}
                distributionLoading={pointsDistributionLoading}
                language={language}
                inOverlay={inOverlay}
                compact={isMobile}
              />
            </m.div>
            {topEntries && topEntries.length > 0 ? (
              <m.div {...fadeUp(E.delayDistribution)}>
                <ResultTopScoresList
                  entries={topEntries}
                  language={language}
                  gamesRoutePrefix={gamesRoutePrefix}
                />
              </m.div>
            ) : null}
            <m.div
              className={isMobile ? undefined : "md:col-span-2"}
              {...fadeUp(E.delayStats)}
            >
              <ResultStatsCard
                post={post}
                minHeightClassName={
                  inOverlay
                    ? undefined
                    : isMobile
                      ? "min-h-[360px]"
                      : "min-h-[400px]"
                }
                language={language}
                inOverlay={inOverlay}
              />
            </m.div>
          </div>
        </React.Fragment>
      </LazyMotion>
    </div>
  );
}
