"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useCallback, useMemo } from "react";
import { Crown } from "lucide-react";
import type { MobileMetric, RankingRowWithCountry } from "./_data/mockRows";
import { metricNum } from "@/lib/rankings/metric";
import { useRankCountUp } from "@/lib/hooks/useCountUpRanking";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import { primeProfileCacheFromRankingRow } from "@/app/component/profile/useProfile";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";

export default function TopPodium({
  rows,
  metric,
  rankPhase,
  playoffRound,
  rankingLeague,
  wcStage,
  onTopCountDone,
  language = "ja",
  compact = false,
  shellTone = "default",
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  rankPhase?: RankingPhase;
  playoffRound?: PlayoffRoundKey;
  rankingLeague?: RankingLeagueSource;
  wcStage?: WcRankingStage;
  onTopCountDone?: () => void;
  language?: Language;
  /** コミュニティ等 — コンパクト行 */
  compact?: boolean;
  shellTone?: "default" | "subtle";
}) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const cardVariants = useMemo<Variants>(
    () => ({
      hidden: {
        opacity: 0,
        y: reduceMotion ? 0 : 10,
        filter: reduceMotion ? "blur(0px)" : "blur(8px)",
      },
      show: (step: number) => ({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: reduceMotion
          ? { duration: 0 }
          : {
              delay: 0.12 + step * 0.11,
              duration: 0.58,
              ease: [0.16, 0.82, 0.32, 1],
            },
      }),
    }),
    [reduceMotion]
  );

  const pathname = usePathname() ?? "";
  const base =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/")
      ? "/mobile"
      : "/web";
  const phaseForReturn = rankPhase ?? "playoffs";

  const r1 = rows[0];
  const r2 = rows[1];
  const r3 = rows[2];

  const a1 = r1 ? metricNum(r1, metric) : { n: 0, d: 0 };
  const a2 = r2 ? metricNum(r2, metric) : null;
  const a3 = r3 ? metricNum(r3, metric) : null;

  const v1n = useRankCountUp(a1.n, 780, a1.d, !!r1, onTopCountDone);
  const v2n = useRankCountUp(a2?.n ?? 0, 520, a2?.d ?? 0, !!r2);
  const v3n = useRankCountUp(a3?.n ?? 0, 520, a3?.d ?? 0, !!r3);

  if (!r1) return null;

  const topRows = [
    r1 ? { rank: 1 as const, row: r1, value: v1n } : null,
    r2 ? { rank: 2 as const, row: r2, value: v2n } : null,
    r3 ? { rank: 3 as const, row: r3, value: v3n } : null,
  ].filter(Boolean) as Array<{
    rank: 1 | 2 | 3;
    row: RankingRowWithCountry;
    value: number;
  }>;

  const metricTag = cyberMetricTag(metric, language);
  const isWebList = base === "/web" && !compact;
  const scoreLayout = isWebList ? ("web" as const) : ("stack" as const);
  const statsLeague = rankingLeague ?? "worldcup";
  const statsContext = {
    rankingLeague: statsLeague,
    wcStage:
      statsLeague === "worldcup" ? (wcStage ?? ("overall" as const)) : undefined,
  };

  const warmProfileRoute = useCallback(
    (profileKey: string, row: RankingRowWithCountry, href: string) => {
      primeProfileCacheFromRankingRow(profileKey, row, statsContext);
      router.prefetch(href);
    },
    [router, statsContext]
  );

  return (
    <div className="pt-3 pb-0">
      <div className="flex flex-col">
        {topRows.map(({ rank, row, value }) => {
          const profileKey = profilePathKeyFromRow(row);
          const profileHref = profileHrefWithRankingsReturn(
            pathname,
            base,
            profileKey,
            {
              metric,
              phase: phaseForReturn,
              playoffRound,
              rankingLeague,
              wcStage,
            }
          );

          return (
            <motion.div
              key={row.uid}
              variants={cardVariants}
              initial={reduceMotion ? "show" : "hidden"}
              animate="show"
              custom={rank - 1}
            >
              <Link
                href={profileHref}
                className="relative block"
                prefetch
                onPointerEnter={() =>
                  warmProfileRoute(profileKey, row, profileHref)
                }
                onFocus={() => warmProfileRoute(profileKey, row, profileHref)}
                onTouchStart={() =>
                  warmProfileRoute(profileKey, row, profileHref)
                }
                onClick={() => warmProfileRoute(profileKey, row, profileHref)}
              >
                <CyberRankingListRow
                  rank={rank}
                  displayName={row.displayName ?? row.handle ?? "Unknown"}
                  photoURL={row.photoURL}
                  metric={metric}
                  metricTag={metricTag}
                  posts={row.posts ?? 0}
                  countryCode={row.countryCode}
                  metricValueDelta={row.metricValueDelta}
                  avgRow={{
                    avgTotalScore: row.avgTotalScore,
                    avgMarginPrecision: row.avgMarginPrecision,
                    avgUpsetScore: row.avgUpsetScore,
                  }}
                  compact={compact}
                  scoreLayout={scoreLayout}
                  subtleShell={shellTone === "subtle"}
                  showCrownSlot={
                    rank === 1 ? (
                      <motion.div
                        className="pointer-events-none leading-none"
                        initial={
                          reduceMotion
                            ? { opacity: 1, y: 0, scale: 1 }
                            : { opacity: 0, y: 4, scale: 0.92 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                delay: 0.42,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }
                        }
                      >
                        <Crown
                          className={
                            compact
                              ? "h-[12px] w-[17px] text-[#F4C542]"
                              : "h-[14px] w-[20px] text-[#F4C542] sm:h-[16px] sm:w-[22px]"
                          }
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          aria-hidden
                        />
                      </motion.div>
                    ) : null
                  }
                  nameExtra={
                    <>
                      <RankDeltaBadge
                        delta={row.rankDeltaPlaces}
                        language={language}
                      />
                      {row.plan === "pro" ? (
                        <ProCyberBadge
                          {...proBadgeStaticMotion}
                          compact
                          ariaLabel={t(language).common.proMember}
                        />
                      ) : null}
                    </>
                  }
                  scoreSlot={
                    <CyberRankingScore
                      rank={rank}
                      metric={metric}
                      counted={value}
                      compact={compact}
                      scoreLayout={scoreLayout}
                    />
                  }
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
