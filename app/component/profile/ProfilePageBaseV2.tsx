// app/component/profile/ProfilePageBaseV2.tsx
"use client";

import { useMemo, useState } from "react";
import { useProfile, type Profile } from "./useProfile";

import MobileProfileViewV2 from "./MobileProfileViewV2";
import WebProfileViewV2 from "./WebProfileViewV2"; // ← まだ無ければ後で作る

import { useUserStatsV2 } from "./useUserStatsV2";
import type { SummaryForCardsV2 } from "./useUserStatsV2";

type Props = { handle: string; variant?: "web" | "mobile" };

export default function ProfilePageBaseV2({ handle, variant = "web" }: Props) {
  const { profile, loading, targetUid } = useProfile(handle);

  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<"overview" | "stats">("overview");
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  // --------- ★ V2 stats を購読 ----------
  const { summaries, loading: statsLoading } = useUserStatsV2(targetUid);

  // --------- avatar 補正 ----------
  const normalizedProfile = useMemo<Profile | undefined>(() => {
    if (!profile) return undefined;

    const p = profile as Profile & { photoURL?: string | null };
    const merged =
      (p.photoURL && p.photoURL.trim().length > 0 ? p.photoURL : p.avatarUrl) ??
      "";

    return { ...p, avatarUrl: merged };
  }, [profile]);

  // --------- ★ SummaryCardsV2 に渡す値 ----------
  const summaryV2: SummaryForCardsV2 | undefined = useMemo(() => {
    return summaries?.[range];
  }, [summaries, range]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!normalizedProfile) return <div style={{ padding: 24 }}>Not found</div>;

  // --------- Mobile/Web 共通の props ----------
  const viewProps = {
    profile: normalizedProfile,
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

// 🔽 🔽 🔽 これを ProfilePageBaseV2.tsx の最後に追加する

export type ProfileViewPropsV2 = {
  profile: Profile;
  isFollowing: boolean;
  onToggleFollow: () => void;

  tab: "overview" | "stats";
  setTab: (v: "overview" | "stats") => void;

  range: "7d" | "30d" | "all";
  setRange: (v: "7d" | "30d" | "all") => void;

  summary?: SummaryForCardsV2;   // ← useUserStatsV2 の summary
  statsLoading: boolean;

  targetUid: string | null;
};
