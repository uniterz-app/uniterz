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
import { prefetchProfileStatsFromRoute } from "@/app/component/profile/useUserStatsV2";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";
import { markRankingsCountUpIntroPlayed } from "@/lib/rankings/rankingsCountUpIntro";

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
  participantCount,
  onCountDone,
  language = "ja",
  size = "default",
  shellTone = "default",
  animateValue = true,
  groupReturnGroupId,
  showFirstPlaceFrame = false,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  rankPhase?: RankingPhase;
  playoffRound?: PlayoffRoundKey;
  rankingLeague?: RankingLeagueSource;
  wcStage?: WcRankingStage;
  /** 総合スコア順位の母数（ティアタグ seed 用） */
  participantCount?: number | null;
  onCountDone?: () => void;
  language?: Language;
  size?: RankingCardSize;
  shellTone?: RankingCardShellTone;
  animateValue?: boolean;
  /** グループ詳細ランキング等 — subtle でも 1 位枠を光らせる */
  showFirstPlaceFrame?: boolean;
  /** グループ内ランキングからプロフィールへ（オーバーレイ等） */
  groupReturnGroupId?: string;
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
    groupId: groupReturnGroupId,
  });

  const warmProfileRoute = useCallback(() => {
    markRankingsCountUpIntroPlayed();
    primeProfileCacheFromRankingRow(
      profileKey,
      r,
      statsContext,
      {
        metric,
        rank,
        participantCount,
      }
    );
    if (groupReturnGroupId) {
      prefetchProfileStatsFromRoute(profileKey, statsContext);
    }
    router.prefetch(profileHref);
  }, [
    groupReturnGroupId,
    profileHref,
    profileKey,
    participantCount,
    r,
    router,
    statsContext,
    metric,
    rank,
  ]);

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
        showFirstPlaceFrame={showFirstPlaceFrame}
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
