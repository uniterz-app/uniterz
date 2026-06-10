"use client";

import { memo } from "react";
import { normalizeLeague } from "@/lib/leagues";
import { ResultLeagueLabelNbaWeb } from "@/app/component/result/ResultLeagueLabelNbaWeb";

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

function ResultLeagueBadgeImpl({
  league,
  teamNameFont,
  compact = false,
}: Props) {
  const normalized = normalizeLeague(league);

  if (normalized === "nba" || normalized === "wc") {
    return (
      <span
        className={[
          "pointer-events-auto inline-flex shrink-0 items-center",
          compact ? "mt-1" : "mt-1 pt-1 sm:mt-1.5 sm:pt-1.5",
        ].join(" ")}
      >
        <ResultLeagueLabelNbaWeb
          text={normalized === "wc" ? "WC" : "NBA"}
        />
      </span>
    );
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
