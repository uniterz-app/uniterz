// app/component/profile/ProfilePageBaseV2.tsx
"use client";

import { useMemo, useState } from "react";
import { useProfile, type Profile } from "./useProfile";

import MobileProfileViewV2 from "./MobileProfileViewV2";
import WebProfileViewV2 from "./WebProfileViewV2";

import { useUserStatsV2 } from "./useUserStatsV2";
import type { SummaryForCardsV2 } from "./useUserStatsV2";
import type { ProfileDailyTrendRow } from "@/lib/profile/profileDailyTrendRow";

type Props = { handle: string; variant?: "web" | "mobile" };

export default function ProfilePageBaseV2({ handle, variant = "web" }: Props) {
  const {
    profile,
    loading,
    targetUid,
  } = useProfile(handle);

  const [tab, setTab] = useState<"overview" | "stats" | "bracket">(
    "overview"
  );
  const [range, setRange] = useState<"7d" | "30d" | "all">("7d");

  const { stats, summaries, loading: statsLoading, dailyTrend } =
    useUserStatsV2(targetUid);

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
    // 現在連勝：user_stats_v2.currentStreak を正（試合終了時に updateUserStreak で更新）
    const currentStreak = (() => {
      if (stats != null) {
        const v = Number((stats as Record<string, unknown>).currentStreak);
        if (Number.isFinite(v)) return Math.max(0, Math.floor(v));
      }
      const u = Number(normalizedProfile?.currentStreak);
      return Number.isFinite(u) ? Math.max(0, Math.floor(u)) : 0;
    })();

    // 最高連勝：maxWinStreak が正。maxStreak はレガシー／エイリアス
    const maxStreak = (() => {
      if (stats != null) {
        const raw = (stats as Record<string, unknown>).maxWinStreak;
        const legacy = (stats as Record<string, unknown>).maxStreak;
        const v = Number(raw ?? legacy);
        if (Number.isFinite(v)) return Math.max(0, Math.floor(v));
      }
      const u = Number(normalizedProfile?.maxStreak);
      return Number.isFinite(u) ? Math.max(0, Math.floor(u)) : 0;
    })();

    return {
      ...normalizedProfile!,
      currentStreak,
      maxStreak,
    };
  }, [normalizedProfile, stats]);

  const summaryV2: SummaryForCardsV2 | undefined = useMemo(() => {
    return summaries?.[range];
  }, [summaries, range]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!normalizedProfile) return <div style={{ padding: 24 }}>Not found</div>;

  const viewProps = {
    profile: mergedProfile,
    tab,
    setTab,
    range,
    setRange,
    summary: summaryV2,
    statsLoading,
    targetUid,
    profileDailyTrendSeed: dailyTrend,
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

  range: "7d" | "30d" | "all";
  setRange: (v: "7d" | "30d" | "all") => void;

  summary?: SummaryForCardsV2;
  statsLoading: boolean;

  targetUid: string | null;

  /** user-stats API の dailyTrend（あれば日次チャートは Firestore を読まない） */
  profileDailyTrendSeed?: ProfileDailyTrendRow[] | null;
};