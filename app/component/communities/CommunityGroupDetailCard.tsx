"use client";

import type { ReactNode } from "react";
import { COMMUNITY_GROUP_HERO_BG } from "@/lib/communities/communityGroupHeroLayout";

type Props = {
  children: ReactNode;
  /** overlay=モーダル / page=一覧からの詳細ページ */
  variant?: "overlay" | "page";
  className?: string;
};

/**
 * グループ詳細の共通シェル — カード枠＋中身（戻りは右端 BACK タブ）
 * Native `CommunityGroupDetailCardNative` 相当
 */
export default function CommunityGroupDetailCard({
  children,
  variant = "overlay",
  className = "",
}: Props) {
  const shadow =
    "shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_48px_-8px_rgba(34,211,238,0.18)]";

  return (
    <div
      className={["relative overflow-hidden rounded-2xl", shadow, className]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: COMMUNITY_GROUP_HERO_BG }}
    >
      {children}
    </div>
  );
}
