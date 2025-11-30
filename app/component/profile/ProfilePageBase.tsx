// app/component/profile/ProfilePageBase.tsx
"use client";

import { useMemo, useState } from "react";
import { useProfile, type Profile } from "./useProfile";
import WebProfileView from "./WebProfileView";
import MobileProfileView from "./MobileProfileView";
import { useUserStats } from "./useUserStats";

type Props = { handle: string; variant?: "web" | "mobile" };

// SummaryCards に渡す形
export type SummaryForCards = {
  posts: number;    // ← postsTotal が入る
  postsTotal: number;
  winRate: number;
  units: number;
  avgOdds: number;
};

export default function ProfilePageBase({ handle, variant = "web" }: Props) {
  const { profile, loading, targetUid } = useProfile(handle);

  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<"overview" | "stats">("overview");
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  // user_stats/{uid}
  const { byRange, loading: statsLoading } = useUserStats(targetUid);

  // avatar 補正
  const normalizedProfile = useMemo<Profile | undefined>(() => {
    if (!profile) return undefined;

    const p = profile as Profile & { photoURL?: string | null };
    const mergedAvatar =
      (p.photoURL && p.photoURL.trim().length > 0 ? p.photoURL : p.avatarUrl) ?? "";

    return { ...p, avatarUrl: mergedAvatar };
  }, [profile]);

  // ★ posts = postsTotal を使う（7d / 30d / all）
 const computedFromStats = useMemo<SummaryForCards | undefined>(() => {
  const b = byRange?.[range];
  if (!b) return undefined;

  // ★ 総投稿数（確定＋未確定）
  const postsTotal = Number(b.createdPosts ?? b.postsTotal ?? 0);

  // ★ 確定投稿数
  const posts = Number(b.posts ?? 0);

  // ★ 勝率＝確定投稿のみ
  const hit = Number(b.hit ?? 0);
  const winRate = posts > 0 ? hit / posts : 0;

  // ★ Units＝確定投稿のみ
  const units =
    typeof b.units === "number" && Number.isFinite(b.units) ? b.units : 0;

  // ★ 平均オッズ＝確定投稿のみ
  const oddsSum =
    typeof b.oddsSum === "number" && Number.isFinite(b.oddsSum)
      ? b.oddsSum
      : 0;

  const oddsCnt =
    typeof b.oddsCnt === "number" && Number.isFinite(b.oddsCnt)
      ? b.oddsCnt
      : 0;

  const avgOdds = oddsCnt > 0 ? oddsSum / oddsCnt : 0;

  return {
    posts,       // ← 確定投稿数
    postsTotal,  // ← 総投稿数（分析数）
    winRate,
    units,
    avgOdds,
  };
}, [byRange, range]);

  // ★ UI に渡すデータはこれだけ（counts.posts で上書きしない）
  const displaySummary = computedFromStats;

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!normalizedProfile) return <div style={{ padding: 24 }}>Not found</div>;

  const viewProps: ProfileViewProps = {
    profile: normalizedProfile,
    isFollowing,
    onToggleFollow: () => setIsFollowing((v) => !v),
    tab,
    setTab,
    range,
    setRange,
    summary: displaySummary,
    statsLoading,
  };

  return variant === "web"
    ? <WebProfileView {...viewProps} />
    : <MobileProfileView {...viewProps} />;
}

export type ProfileViewProps = {
  profile: Profile;
  isFollowing: boolean;
  onToggleFollow: () => void;

  tab: "overview" | "stats";
  setTab: React.Dispatch<React.SetStateAction<"overview" | "stats">>;
  range: "7d" | "30d" | "all";
  setRange: React.Dispatch<React.SetStateAction<"7d" | "30d" | "all">>;

  summary?: SummaryForCards;
  statsLoading: boolean;
};
