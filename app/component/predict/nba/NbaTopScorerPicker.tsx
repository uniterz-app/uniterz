"use client";

import { useMemo } from "react";
import {
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { matchScoreClass, nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";

type Props = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeLabel: string;
  awayLabel: string;
  candidates: NbaTopScorerCandidate[];
  value: NbaTopScorerPick | null;
  onChange: (next: NbaTopScorerPick | null) => void;
  language: Language;
  isMobile?: boolean;
};

function fmtPpg(ppg: number | null | undefined): string {
  if (ppg == null || !Number.isFinite(ppg)) return "—";
  return ppg.toFixed(1);
}

function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.slice(-3)).toUpperCase();
}

export default function NbaTopScorerPicker({
  candidates,
  value,
  onChange,
  language,
  isMobile = false,
}: Props) {
  const m = t(language).predict;
  const sorted = useMemo(
    () => sortNbaTopScorerCandidatesByPpg(candidates),
    [candidates]
  );

  const onPick = (row: NbaTopScorerCandidate) => {
    if (value?.playerId === row.playerId && value?.teamId === row.teamId) {
      onChange(null);
      return;
    }
    onChange({ playerId: row.playerId, teamId: row.teamId, name: row.name });
  };

  return (
    <div className="mt-3 px-0 py-1">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <div
            className={[
              nameBebas.className,
              "shrink-0 font-bold uppercase leading-none text-white",
              isMobile ? "text-[15px]" : "text-[18px]",
            ].join(" ")}
            style={matchCardTeamNameStyle(true)}
          >
            {m.nbaTopScorerTitle}
          </div>
          <div
            className={[
              nameOxanium.className,
              "shrink-0 font-bold uppercase tracking-[0.08em] text-white/50",
              isMobile ? "text-[9px]" : "text-[10px]",
            ].join(" ")}
          >
            {m.nbaTopScorerBonusHint}
          </div>
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={[
              "shrink-0 text-white/45 underline-offset-2 hover:text-white/70 hover:underline",
              isMobile ? "text-[10px]" : "text-[11px]",
            ].join(" ")}
          >
            {m.nbaTopScorerClear}
          </button>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <p
          className={[
            "text-white/40",
            isMobile ? "text-[11px]" : "text-xs",
          ].join(" ")}
        >
          {m.nbaTopScorerEmpty}
        </p>
      ) : (
        <div className="max-h-52 space-y-0.5 overflow-y-auto pr-0.5">
          {sorted.map((row) => {
            const selected =
              value?.playerId === row.playerId &&
              value?.teamId === row.teamId;
            const teamColor =
              getTeamPrimaryColor("nba", row.teamId) ?? "#e8edf5";
            return (
              <button
                key={`${row.teamId}-${row.playerId}`}
                type="button"
                onClick={() => onPick(row)}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-lg text-left transition",
                  isMobile ? "px-2 py-1.5" : "px-2.5 py-2",
                  selected
                    ? "bg-cyan-500/22 ring-1 ring-cyan-400/35"
                    : "hover:bg-white/6",
                ].join(" ")}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={[
                      "min-w-0 truncate font-medium text-white/90",
                      isMobile ? "text-xs leading-tight" : "text-sm",
                    ].join(" ")}
                  >
                    {row.name}
                  </span>
                  <span
                    className={[
                      nameOxanium.className,
                      "shrink-0 rounded-[2px] border bg-transparent px-1.5 py-0.5 font-extrabold uppercase tracking-[0.12em]",
                      isMobile ? "text-[7px]" : "text-[8px]",
                    ].join(" ")}
                    style={{
                      borderColor: teamColor,
                      color: teamColor,
                    }}
                  >
                    {teamAbbr(row.teamId)}
                  </span>
                </span>
                <span
                  className={[
                    matchScoreClass,
                    "shrink-0 tabular-nums tracking-wide",
                    isMobile ? "text-[11px]" : "text-xs",
                    selected ? "text-cyan-100/90" : "text-white/55",
                  ].join(" ")}
                >
                  {fmtPpg(row.ppg)}
                  <span
                    className={[
                      "ml-1 font-semibold uppercase",
                      isMobile ? "text-[8px]" : "text-[9px]",
                      selected ? "text-cyan-200/55" : "text-white/30",
                    ].join(" ")}
                  >
                    PPG
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
