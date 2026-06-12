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
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";
import { useProfileScopedStreak } from "@/lib/profile/useProfileScopedStreak";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

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

  const { stats, summary, summaryRanks, statsLoading, dailyTrend } =
    useUserStatsV2(targetUid, profileStatsContext);

  const scopedStreak = useProfileScopedStreak(targetUid, profileStatsContext);

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

  const mergedProfile = useMemo<Profile>(() => {
    const currentStreak = Math.max(0, Math.floor(scopedStreak.currentStreak));
    const maxStreak = Math.max(0, Math.floor(scopedStreak.maxWinStreak));

    return {
      ...normalizedProfile!,
      currentStreak,
      maxStreak,
    };
  }, [
    normalizedProfile,
    scopedStreak.currentStreak,
    scopedStreak.maxWinStreak,
  ]);

  const summaryV2: SummaryForCardsV2 | undefined = useMemo(() => {
    if (!summary) return undefined;
    return {
      ...summary,
      activeWinStreak: Math.max(0, Math.floor(scopedStreak.currentStreak)),
    };
  }, [summary, scopedStreak.currentStreak]);

  if (loading) {
    return (
      <div className="flex justify-center" style={{ padding: 24 }}>
        <CandleChartLoader />
      </div>
    );
  }
  if (!normalizedProfile) return <div style={{ padding: 24 }}>Not found</div>;

  const viewProps = {
    profile: mergedProfile,
    tab,
    setTab,
    summary: summaryV2,
    summaryRanks: summaryRanks ?? undefined,
    statsLoading,
    targetUid,
    profileDailyTrendSeed: dailyTrend,
    profileStatsContext,
    onToggleStatsLeague,
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
  statsLoading: boolean;

  targetUid: string | null;

  /** user-stats API の dailyTrend（あれば日次チャートは Firestore を読まない） */
  profileDailyTrendSeed?: ProfileDailyTrendRow[] | null;
  profileStatsContext: {
    rankingLeague: RankingLeagueSource;
    wcStage?: WcRankingStage;
  };
  onToggleStatsLeague: () => void;
};