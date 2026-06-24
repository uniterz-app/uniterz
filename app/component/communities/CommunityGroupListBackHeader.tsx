"use client";

import { ChevronLeft } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { communityGroupListBackLabel } from "@/lib/communities/communityGroupShell";
import {
  COMMUNITY_GROUP_HERO_BG,
  COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT,
} from "@/lib/communities/communityGroupHeroLayout";
import { communityCrtMono } from "./CommunityCrtTheme";

type Props = {
  language: Language;
  onClick: () => void;
  /** solid=カード上端 / overImage=ヒーロー画像上にオーバーレイ */
  variant?: "solid" | "overImage";
};

/** Native `CommunityGroupListBackHeaderNative` 相当 */
export default function CommunityGroupListBackHeader({
  language,
  onClick,
  variant = "solid",
}: Props) {
  const label = communityGroupListBackLabel(language);
  const overImage = variant === "overImage";

  return (
    <div
      className={[
        "flex items-center px-2.5",
        overImage
          ? "pointer-events-none absolute inset-x-0 top-0 z-20"
          : "rounded-t-2xl border-b border-cyan-400/12",
      ].join(" ")}
      style={{
        height: COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT,
        backgroundColor: overImage ? "transparent" : COMMUNITY_GROUP_HERO_BG,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className={[
          "pointer-events-auto inline-flex items-center gap-0.5",
          overImage
            ? "rounded-none border border-cyan-400/35 bg-black/50 px-2.5 py-1.5 text-cyan-50/95 shadow-[0_0_14px_rgba(34,211,238,0.22)] backdrop-blur-sm hover:bg-cyan-500/15"
            : "rounded-sm px-1 py-1 text-cyan-200/90 hover:bg-white/5",
        ].join(" ")}
        aria-label={label}
      >
        <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
        <span
          className={[
            "text-xs font-semibold tracking-[0.14em]",
            communityCrtMono.className,
          ].join(" ")}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
