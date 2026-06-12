"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { RankingRowWithCountry, MobileMetric } from "./_data/mockRows";
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

export type RankingCardSize = "default" | "compact";
export type RankingCardShellTone = "default" | "subtle";

export default function RankingCard({
  row: r,
  rank,
  metric,
  rankPhase,
  playoffRound,
  rankingLeague,
  wcStage,
  onCountDone,
  language = "ja",
  size = "default",
  shellTone = "default",
  animateValue = true,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  rankPhase?: RankingPhase;
  playoffRound?: PlayoffRoundKey;
  rankingLeague?: RankingLeagueSource;
  wcStage?: WcRankingStage;
  onCountDone?: () => void;
  language?: Language;
  size?: RankingCardSize;
  shellTone?: RankingCardShellTone;
  animateValue?: boolean;
}) {
  const compact = size === "compact";
  const subtleShell = shellTone === "subtle";
  const router = useRouter();

  const pathname = usePathname() ?? "";
  const base = pathname.startsWith("/mobile") || pathname.startsWith("/m/")
    ? "/mobile"
    : "/web";
  const profileKey = profilePathKeyFromRow(r);
  const statsLeague = rankingLeague ?? "worldcup";
  const statsContext = {
    rankingLeague: statsLeague,
    wcStage:
      statsLeague === "worldcup" ? (wcStage ?? ("overall" as const)) : undefined,
  };
  const profileHref = profileHrefWithRankingsReturn(pathname, base, profileKey, {
    metric,
    phase: rankPhase ?? "playoffs",
    playoffRound,
    rankingLeague: statsLeague,
    wcStage: statsContext.wcStage,
  });

  const warmProfileRoute = useCallback(() => {
    primeProfileCacheFromRankingRow(profileKey, r, statsContext);
    router.prefetch(profileHref);
  }, [profileHref, profileKey, r, router, statsContext]);

  const { n: target, d: decimals } = metricNum(r, metric);
  const counted = useRankCountUp(
    target,
    900,
    decimals,
    animateValue,
    rank === 1 ? onCountDone : undefined
  );

  const displayName = r.displayName ?? r.handle ?? "Unknown";
  const metricTag = cyberMetricTag(metric, language);
  const isWebList = base === "/web" && !compact;
  const scoreLayout = isWebList ? ("web" as const) : ("stack" as const);

  return (
    <Link
      href={profileHref}
      className="block min-w-0"
      prefetch
      onPointerEnter={warmProfileRoute}
      onFocus={warmProfileRoute}
      onTouchStart={warmProfileRoute}
      onClick={warmProfileRoute}
    >
      <CyberRankingListRow
        rank={rank}
        displayName={displayName}
        photoURL={r.photoURL}
        metric={metric}
        metricTag={metricTag}
        posts={r.posts ?? 0}
        countryCode={r.countryCode}
        metricValueDelta={r.metricValueDelta}
        avgRow={{
          avgTotalScore: r.avgTotalScore,
          avgMarginPrecision: r.avgMarginPrecision,
          avgUpsetScore: r.avgUpsetScore,
        }}
        compact={compact}
        scoreLayout={scoreLayout}
        subtleShell={subtleShell}
        nameExtra={
          <>
            <RankDeltaBadge delta={r.rankDeltaPlaces} language={language} />
            {r.plan === "pro" ? (
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
            counted={counted}
            compact={compact}
            scoreLayout={scoreLayout}
          />
        }
      />
    </Link>
  );
}
