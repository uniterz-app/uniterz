"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import { listMetricBarPct } from "@/lib/rankings/podiumMetricBar";
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
  barMaxValue = 0,
  barEnterDelay = 0,
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
  /** 1位の指標値。セグメントバーの 100% 基準 */
  barMaxValue?: number;
  /** セグメントバー左から点灯の開始遅延（秒） */
  barEnterDelay?: number;
}) {
  const compact = size === "compact";
  const subtleShell = shellTone === "subtle";

  const pathname = usePathname() ?? "";
  const base = pathname.startsWith("/mobile") || pathname.startsWith("/m/")
    ? "/mobile"
    : "/web";
  const profileKey = profilePathKeyFromRow(r);
  const profileHref = profileHrefWithRankingsReturn(pathname, base, profileKey, {
    metric,
    phase: rankPhase ?? "playoffs",
    playoffRound,
    rankingLeague,
    wcStage,
  });

  const { n: target, d: decimals } = metricNum(r, metric);
  const counted = useRankCountUp(
    target,
    900,
    decimals,
    animateValue,
    rank === 1 ? onCountDone : undefined
  );

  const displayName = r.displayName ?? r.handle ?? "Unknown";
  const barPct = listMetricBarPct(metric, r, barMaxValue);
  const metricTag = cyberMetricTag(metric, language);

  return (
    <Link href={profileHref} className="block min-w-0">
      <CyberRankingListRow
        rank={rank}
        displayName={displayName}
        photoURL={r.photoURL}
        barPct={barPct}
        metric={metric}
        metricTag={metricTag}
        posts={r.posts ?? 0}
        language={language}
        compact={compact}
        subtleShell={subtleShell}
        barEnterDelay={barEnterDelay}
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
          />
        }
      />
    </Link>
  );
}
