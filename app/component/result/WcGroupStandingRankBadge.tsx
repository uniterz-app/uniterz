"use client";

import type { Language } from "@/lib/i18n/language";
import { formatWcGroupStandingRankLabel } from "@/lib/wc/wcGroupStandingRank";

type Props = {
  rank: number | null | undefined;
  language: Language;
  compact?: boolean;
};

/** 国旗の直上 — グループ内順位（例: 4th） */
export default function WcGroupStandingRankBadge({
  rank,
  language,
  compact = false,
}: Props) {
  if (rank == null || rank <= 0) return null;
  const label = formatWcGroupStandingRankLabel(rank, language);
  return (
    <span
      className={[
        "mb-1 inline-flex items-center justify-center rounded-md border border-white/10",
        "bg-white/[0.08] font-semibold tabular-nums text-white/55",
        compact ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]",
      ].join(" ")}
      aria-label={language === "ja" ? `グループ ${rank} 位` : `Group rank ${rank}`}
    >
      {label}
    </span>
  );
}
