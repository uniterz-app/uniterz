"use client";

import type { Language } from "@/lib/i18n/language";
import { useTeamRecordLine } from "@/lib/hooks/useTeamRecordLine";
import { formatTeamRecordWithRank } from "@/lib/teamRecordDisplay";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  teamId: string | null | undefined;
  league: string;
  language: Language;
  compact?: boolean;
};

/** 国名下 — Firestore teams の勝敗分 + グループ順位 */
export default function TeamRecordLineFromFirestore({
  teamId,
  league,
  language: _language,
  compact = false,
}: Props) {
  void _language;
  const record = useTeamRecordLine(teamId, league);
  const label = formatTeamRecordWithRank(record, league);

  return (
    <span
      className={[
        resultStatsMetricNumClass,
        "inline-block max-w-full whitespace-nowrap tabular-nums opacity-85",
        compact ? "text-[10px]" : "text-[11px] md:text-[15px]",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
