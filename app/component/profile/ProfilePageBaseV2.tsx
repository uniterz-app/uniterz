// app/component/profile/ProfilePageBaseV2.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useProfile, type Profile } from "./useProfile";

import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import MobileProfileViewV2 from "./MobileProfileViewV2";
import WebProfileViewV2 from "./WebProfileViewV2";

import { useUserStatsV2 } from "./useUserStatsV2";
import type { SummaryForCardsV2, SummaryRanksV2 } from "./useUserStatsV2";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { useProfileScopedStreak } from "@/lib/profile/useProfileScopedStreak";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
  PROFILE_FROM_PARAM,
  PROFILE_FROM_GROUP_VALUE,
  PROFILE_FROM_COMMUNITY_VALUE,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";
import { useProfileKinetikWcStackedStats } from "@/lib/profile/useProfileKinetikWcStackedStats";
import type { ProfileKinetikMetricsSection } from "@/lib/profile/profileKinetikMetricsSection";

type Props = { handle: string; variant?: "web" | "mobile" };

export default function ProfilePageBaseV2({ handle, variant = "web" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const {
    profile,
    loading,
    targetUid,
  } = useProfile(handle);

  const [tab, setTab] = useState<"overview" | "stats" | "bracket">(
    "overview"
  );

  const profileStatsContext = useMemo<{
    rankingLeague: RankingLeagueSource;
    wcStage?: WcRankingStage;
  }>(() => {
    const rawLeague = sp.get(RANKINGS_TAB_LEAGUE_PARAM);
    if (isRankingLeagueSource(rawLeague)) {
      const rankingLeague = rawLeague;
      const rawWcStage = sp.get(RANKINGS_TAB_WC_STAGE_PARAM);
      const wcStage =
        rankingLeague === "worldcup" && isWcRankingStage(rawWcStage)
          ? rawWcStage
          : rankingLeague === "worldcup"
            ? ("overall" as WcRankingStage)
          : undefined;
      return { rankingLeague, wcStage };
    }

    return {
      rankingLeague: "worldcup" as RankingLeagueSource,
      wcStage: "overall" as WcRankingStage,
    };
  }, [sp]);

  // グループランキング由来の遷移は、行に入っている「グループ作成日からの期間集計」を
  // プロフィールに出さず、リーグ/ステージの全期間スタッツ（WC は大会通算）を表示する
  const fromGroup = useMemo(() => {
    const from = sp.get(PROFILE_FROM_PARAM);
    return (
      from === PROFILE_FROM_GROUP_VALUE || from === PROFILE_FROM_COMMUNITY_VALUE
    );
  }, [sp]);

  const { stats, summary, summaryRanks, metricValueDeltas, statsLoading, dailyTrend } =
    useUserStatsV2(targetUid, {
      ...profileStatsContext,
      prefetchOtherLeague: false,
      routeKey: handle,
      skipPrimedStatsCache: fromGroup,
    });

  const scopedStreak = useProfileScopedStreak(targetUid, profileStatsContext);

  const { sections: wcStackedMetricsSections, loading: wcStackedStatsLoading } =
    useProfileKinetikWcStackedStats(
      targetUid,
      profileStatsContext.rankingLeague === "worldcup",
      Math.max(0, Math.floor(scopedStreak.currentStreak))
    );

  /**
   * WC 全体（overall）の連勝は updateUserStreak が試合確定時に保存するライブ値を
   * サーバー API（summary）経由で採用する。投稿スキャンの待ち時間なしで即時表示でき、
   * 「試合が終わったらインクリメントされた連勝」をそのまま読む。
   * NBA / WC ステージ別（qualifying・main）は従来どおりスコープ集計を使う。
   */
  const useLiveOverallStreak =
    profileStatsContext.rankingLeague === "worldcup" &&
    (profileStatsContext.wcStage ?? "overall") === "overall";

  const effectiveStreak = useMemo(() => {
    if (
      profileStatsContext.rankingLeague === "worldcup" &&
      wcStackedMetricsSections?.[0]
    ) {
      return {
        currentStreak: wcStackedMetricsSections[0].winStreak,
        maxWinStreak: Math.max(
          wcStackedMetricsSections[0].winStreak,
          wcStackedMetricsSections[1]?.winStreak ?? 0
        ),
      };
    }
    if (useLiveOverallStreak && summary) {
      return {
        currentStreak: Math.max(0, Math.floor(summary.activeWinStreak ?? 0)),
        maxWinStreak: Math.max(0, Math.floor(summary.maxWinStreak ?? 0)),
      };
    }
    return {
      currentStreak: Math.max(0, Math.floor(scopedStreak.currentStreak)),
      maxWinStreak: Math.max(0, Math.floor(scopedStreak.maxWinStreak)),
    };
  }, [
    profileStatsContext.rankingLeague,
    wcStackedMetricsSections,
    useLiveOverallStreak,
    summary,
    scopedStreak.currentStreak,
    scopedStreak.maxWinStreak,
  ]);

  const onToggleStatsLeague = useCallback(() => {
    const current = profileStatsContext.rankingLeague;
    const nextLeague: RankingLeagueSource =
      current === "worldcup" ? "nba" : "worldcup";
    const qs = new URLSearchParams(sp.toString());
    qs.set(RANKINGS_TAB_LEAGUE_PARAM, nextLeague);
    if (nextLeague === "worldcup") {
      qs.set(RANKINGS_TAB_WC_STAGE_PARAM, profileStatsContext.wcStage ?? "overall");
    } else {
      qs.delete(RANKINGS_TAB_WC_STAGE_PARAM);
    }
    const nextUrl = `${pathname ?? ""}?${qs.toString()}`;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, profileStatsContext.rankingLeague, profileStatsContext.wcStage, router, sp]);

  const normalizedProfile = useMemo<Profile | undefined>(() => {
    if (!profile) return undefined;

    const p = profile as Profile & { photoURL?: string | null };
    const merged =
      (p.photoURL && p.photoURL.trim().length > 0
        ? p.photoURL
        : p.avatarUrl) ?? "";

    return { ...p, avatarUrl: merged };
  }, [profile]);

  const mergedProfile = useMemo<Profile | null>(() => {
    if (!normalizedProfile) return null;

    return {
      ...normalizedProfile,
      currentStreak: effectiveStreak.currentStreak,
      maxStreak: effectiveStreak.maxWinStreak,
    };
  }, [
    normalizedProfile,
    effectiveStreak.currentStreak,
    effectiveStreak.maxWinStreak,
  ]);

  const summaryV2: SummaryForCardsV2 | undefined = useMemo(() => {
    if (!summary) return undefined;
    return {
      ...summary,
      activeWinStreak: effectiveStreak.currentStreak,
    };
  }, [summary, effectiveStreak.currentStreak]);

  if (loading && !targetUid) {
    return (
      <div className="flex justify-center" style={{ padding: 24 }}>
        <CandleChartLoader />
      </div>
    );
  }
  if (!loading && !targetUid) {
    return <div style={{ padding: 24 }}>Not found</div>;
  }
  if (!mergedProfile) {
    return (
      <div className="flex justify-center" style={{ padding: 24 }}>
        <CandleChartLoader />
      </div>
    );
  }

  const viewProps = {
    profile: mergedProfile,
    tab,
    setTab,
    summary: summaryV2,
    summaryRanks: summaryRanks ?? undefined,
    metricValueDeltas: metricValueDeltas ?? undefined,
    statsLoading,
    targetUid,
    profileDailyTrendSeed: dailyTrend,
    profileStatsContext,
    onToggleStatsLeague,
    wcStackedMetricsSections: wcStackedMetricsSections ?? undefined,
    wcStackedStatsLoading,
  };

  return variant === "web" ? (
    <WebProfileViewV2 {...viewProps} />
  ) : (
    <MobileProfileViewV2 {...viewProps} />
  );
}

export type ProfileViewPropsV2 = {
  profile: Profile;

  tab: "overview" | "stats" | "bracket";
  setTab: (v: "overview" | "stats" | "bracket") => void;

  summary?: SummaryForCardsV2;
  summaryRanks?: SummaryRanksV2;
  metricValueDeltas?: MyRankMetricValueDeltas;
  statsLoading: boolean;

  targetUid: string | null;

  /** user-stats API の dailyTrend（あれば日次チャートは Firestore を読まない） */
  profileDailyTrendSeed?: ProfileDailyTrendRow[] | null;
  profileStatsContext: {
    rankingLeague: RankingLeagueSource;
    wcStage?: WcRankingStage;
  };
  onToggleStatsLeague: () => void;
  wcStackedMetricsSections?: ProfileKinetikMetricsSection[];
  wcStackedStatsLoading?: boolean;
};