"use client";

import type { ReactNode } from "react";
import type { Language } from "@/lib/i18n/language";
import { COMMUNITY_GROUP_HERO_BG } from "@/lib/communities/communityGroupHeroLayout";
import CommunityGroupListBackHeader from "@/app/component/communities/CommunityGroupListBackHeader";

type Props = {
  language: Language;
  onBack: () => void;
  children: ReactNode;
  /** overlay=モーダル / page=一覧からの詳細ページ */
  variant?: "overlay" | "page";
  /** Web — 「一覧へ」をヒーロー画像上に載せる（カード上端の帯を出さない） */
  backHeaderOverHero?: boolean;
  className?: string;
};

/**
 * グループ詳細の共通シェル — 「一覧へ」＋カード枠＋中身
 * Native `CommunityGroupDetailCardNative` 相当
 */
export default function CommunityGroupDetailCard({
  language,
  onBack,
  children,
  variant = "overlay",
  backHeaderOverHero = false,
  className = "",
}: Props) {
  const shadow =
    variant === "overlay"
      ? "shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_48px_-8px_rgba(34,211,238,0.18)]"
      : "shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_48px_-8px_rgba(34,211,238,0.18)]";

  return (
    <div
      className={["relative overflow-hidden rounded-2xl", shadow, className]
        .filter(Boolean)
        .join(" ")}
      style={{ backgroundColor: COMMUNITY_GROUP_HERO_BG }}
    >
      {!backHeaderOverHero ? (
        <CommunityGroupListBackHeader language={language} onClick={onBack} />
      ) : null}
      {children}
    </div>
  );
}
