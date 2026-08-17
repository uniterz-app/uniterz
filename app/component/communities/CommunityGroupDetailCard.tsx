"use client";

import type { ReactNode } from "react";
import { COMMUNITY_GROUP_HERO_BG } from "@/lib/communities/communityGroupHeroLayout";
import { MATCH_LIST_CYBER_CARD_CLASS } from "@/lib/ui/matchListCardCyber";
import { RANKINGS_CARD_NOTCH_CLIP } from "@/lib/rankings/rankingsCyberTheme";

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
  return (
    <div
      className={[
        "relative overflow-hidden",
        MATCH_LIST_CYBER_CARD_CLASS,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: COMMUNITY_GROUP_HERO_BG,
        backgroundColor: COMMUNITY_GROUP_HERO_BG,
        ...(variant === "overlay"
          ? {
              clipPath: RANKINGS_CARD_NOTCH_CLIP,
              WebkitClipPath: RANKINGS_CARD_NOTCH_CLIP,
            }
          : null),
      }}
    >
      {children}
    </div>
  );
}
