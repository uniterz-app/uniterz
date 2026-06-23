"use client";

import { memo } from "react";
import { normalizeLeague } from "@/lib/leagues";

const leaguePillBg: Record<string, string> = {
  nba: "#1D428A",
  bj: "#C8102E",
  pl: "#3A0CA3",
  j1: "#E10600",
  wc: "#56042C",
};

const leagueLabel: Record<string, string> = {
  nba: "NBA",
  bj: "B1",
  pl: "PL",
  j1: "J1",
  wc: "WC",
};

type Props = {
  league: string;
  teamNameFont?: React.CSSProperties;
  /** ResultCard 一覧のコンパクト行用 */
  compact?: boolean;
};

/** Native と同様：NBA / WC はタブで区別するためカード左上には出さない */
export function shouldShowResultLeagueBadge(league: string): boolean {
  const normalized = normalizeLeague(league);
  return normalized !== "nba" && normalized !== "wc";
}

function ResultLeagueBadgeImpl({
  league,
  teamNameFont,
  compact = false,
}: Props) {
  const normalized = normalizeLeague(league);

  if (!shouldShowResultLeagueBadge(normalized)) {
    return null;
  }

  const pillBg = leaguePillBg[normalized] ?? "#334155";
  const pillText = leagueLabel[normalized] ?? normalized.toUpperCase();

  return (
    <span
      className={[
        "pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase tracking-widest",
        compact
          ? "px-2 py-0.5 text-[9px]"
          : "px-2.5 py-1 text-[10px] sm:px-3 sm:py-1 sm:text-[11px]",
      ].join(" ")}
      style={{ backgroundColor: pillBg, ...teamNameFont }}
    >
      {pillText}
    </span>
  );
}

export const ResultLeagueBadge = memo(ResultLeagueBadgeImpl);
ResultLeagueBadge.displayName = "ResultLeagueBadge";
