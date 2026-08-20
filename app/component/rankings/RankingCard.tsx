"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { RankingRowWithCountry, MobileMetric } from "@/lib/rankings/rankingMetrics";
import { metricNum } from "@/lib/rankings/metric";
import { useRankCountUp } from "@/lib/hooks/useCountUpRanking";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { RankingNameBadges } from "@/app/component/common/RankingNameBadges";
import { proBadgeStaticMotion } from "@/app/component/common/ProCyberBadge";
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
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

export type RankingCardSize = "default" | "compact";
export type RankingCardShellTone = "default" | "subtle";

function rankingRowProSkinVariant(
  plan: string | undefined,
  raw: string | undefined
): ProfilePlanProBgVariant | null {
  if (plan !== "pro") return null;
  return parseUserPlanProBgVariant(raw);
}

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
  const statsLeague = rankingLeague ?? "nba";
  const statsContext = {
    rankingLeague: statsLeague,
    wcStage: undefined,
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
    // グループランキング行は「期間集計」値のため、共有スタッツキャッシュには prime せず
    // 全期間スタッツは API から先読みする（プロフィールは全期間を表示）
    primeProfileCacheFromRankingRow(
      profileKey,
      r,
      statsContext,
      {
        metric,
        rank,
        participantCount,
      },
      groupReturnGroupId ? { skipStatsPrime: true } : undefined
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
  const proSkinVariant = rankingRowProSkinVariant(r.plan, r.planProBgVariant);

  return (
    <Link
      href={profileHref}
      className="block min-w-0 origin-center transition-[transform,opacity] duration-100 ease-out active:scale-[0.99] active:opacity-95"
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
        proSkinVariant={proSkinVariant}
        proSkinIntensity="medium"
        nameExtra={
          <RankingNameBadges
            {...proBadgeStaticMotion}
            compact
            isPro={r.plan === "pro"}
            proLabel={t(language).common.proMember}
          />
        }
        rankDeltaPlaces={r.rankDeltaPlaces}
        language={language}
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
