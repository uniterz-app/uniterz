// app/component/profile/ProfilePageBaseV2.tsx
"use client";

import { useMemo, useState } from "react";
import { useProfile, type Profile } from "./useProfile";

import MobileProfileViewV2 from "./MobileProfileViewV2";
import WebProfileViewV2 from "./WebProfileViewV2";

import { useUserStatsV2 } from "./useUserStatsV2";
import type { SummaryForCardsV2 } from "./useUserStatsV2";

type Props = { handle: string; variant?: "web" | "mobile" };

export default function ProfilePageBaseV2({ handle, variant = "web" }: Props) {
  const { profile, loading, targetUid } = useProfile(handle);

  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<"overview" | "stats">("overview");
  const [range, setRange] = useState<"7d" | "30d" | "all">("7d");

  // ============================
  // ★ V2 stats を購読
  // ============================
  const { stats, summaries, loading: statsLoading } = useUserStatsV2(targetUid);

  // ============================
  // avatar の補正
  // ============================
  const normalizedProfile = useMemo<Profile | undefined>(() => {
    if (!profile) return undefined;

    const p = profile as Profile & { photoURL?: string | null };
    const merged =
      (p.photoURL && p.photoURL.trim().length > 0
        ? p.photoURL
        : p.avatarUrl) ?? "";

    return { ...p, avatarUrl: merged };
  }, [profile]);

  const mergedProfile = useMemo<Profile>(() => ({
  ...normalizedProfile!,
  currentStreak: stats?.currentStreak ?? 0,
  maxStreak: stats?.maxStreak ?? 0,
}), [normalizedProfile, stats]);

  // ============================
  // SummaryCardsV2 用のデータ
  // ============================
  const summaryV2: SummaryForCardsV2 | undefined = useMemo(() => {
    return summaries?.[range];
  }, [summaries, range]);

  // ============================
  // Loading / Not Found
  // ============================
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!normalizedProfile) return <div style={{ padding: 24 }}>Not found</div>;

  // ============================
  // Mobile / Web 共通 props
  // ============================
  const viewProps = {
    profile: mergedProfile,
    isFollowing,
    onToggleFollow: () => setIsFollowing((v) => !v),
    tab,
    setTab,
    range,
    setRange,
    summary: summaryV2,
    statsLoading,
    targetUid,
  };

  return variant === "web"
    ? <WebProfileViewV2 {...viewProps} />
    : <MobileProfileViewV2 {...viewProps} />;
}

// ============================
// ProfileViewPropsV2 型
// ============================
export type ProfileViewPropsV2 = {
  profile: Profile;
  isFollowing: boolean;
  onToggleFollow: () => void;

  tab: "overview" | "stats";
  setTab: (v: "overview" | "stats") => void;

  range: "7d" | "30d" | "all";
  setRange: (v: "7d" | "30d" | "all") => void;

  summary?: SummaryForCardsV2; // ← useUserStatsV2 のまとめ値
  statsLoading: boolean;

  targetUid: string | null;
};
