"use client";

import type { Language } from "@/lib/i18n/language";
import {
  formatWcGroupStageRecordLabel,
  type WcGroupStandingEntry,
} from "@/lib/wc/wcGroupStandingRank";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  standing: WcGroupStandingEntry | null | undefined;
  language: Language;
  compact?: boolean;
};

/** 国旗下 — 勝敗分の横にグループ順位 */
export default function WcGroupStandingRecordLine({
  standing,
  language,
  compact = false,
}: Props) {
  if (!standing) return null;
  const label = formatWcGroupStageRecordLabel(standing, language);

  return (
    <span
      className={[
        resultStatsMetricNumClass,
        "inline-block max-w-full truncate tabular-nums opacity-85",
        compact ? "text-[10px]" : "text-[11px] md:text-[15px]",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
