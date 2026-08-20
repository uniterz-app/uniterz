"use client";

import { useEffect, useMemo, useState } from "react";
import {
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameBebas, nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import {
  injuryStatusByPlayerId,
  injuryStatusLabel,
  injuryStatusTone,
  type NbaInjuryReport,
} from "@/lib/predict/nbaInjuryReport";
import { injuryReportForMatchup } from "@/lib/predict/nbaInjuryReportPreviewMocks";

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
  /** 本番データ。無いときはマッチアップ mock にフォールバック */
  injuryReport?: NbaInjuryReport | null;
};

const INJURY_CHIP: Record<string, string> = {
  out: "border-[#FF2D78]/70 bg-[#FF2D78]/20 text-[#FF8AB4]",
  doubt: "border-[#FF8A3D]/70 bg-[#FF8A3D]/18 text-[#FFB07A]",
  question: "border-[#F5C518]/70 bg-[#F5C518]/15 text-[#F5C518]",
  probable: "border-[#00E5FF]/60 bg-[#00E5FF]/12 text-[#00E5FF]",
  available: "border-[#2DFF6E]/50 bg-[#2DFF6E]/10 text-[#2DFF6E]",
  neutral: "border-white/25 bg-white/8 text-white/60",
};

function InjuryChip({ status }: { status: string }) {
  const tone = injuryStatusTone(status);
  return (
    <span
      className={[
        nameOxanium.className,
        "mt-0.5 inline-flex w-fit rounded-[2px] border px-1 py-px text-[6px] font-extrabold uppercase tracking-[0.04em]",
        INJURY_CHIP[tone] ?? INJURY_CHIP.neutral,
      ].join(" ")}
    >
      {injuryStatusLabel(status)}
    </span>
  );
}

const TOP_N = 5;
const playerNameTy = matchCardTeamNameStyle(true);
const rankCellSkew = { transform: "skewX(-10deg)" } as const;
const metricCellSkew = { transform: "skewX(-6deg)" } as const;

function fmtPpg(ppg: number | null | undefined): string {
  if (ppg == null || !Number.isFinite(ppg)) return "—";
  return ppg.toFixed(1);
}

function rankNumberClass(rank: number): string {
  if (rank <= 6) return "text-emerald-300";
  if (rank <= 10) return "text-amber-300";
  return "text-red-300/80";
}

function isSamePick(
  value: NbaTopScorerPick | null,
  row: NbaTopScorerCandidate
): boolean {
  return value?.playerId === row.playerId && value?.teamId === row.teamId;
}

export default function NbaTopScorerPicker({
  homeTeamId,
  awayTeamId,
  candidates,
  value,
  onChange,
  language,
  injuryReport,
}: Props) {
  const m = t(language).predict;
  const isJa = language === "ja";
  const sorted = useMemo(
    () => sortNbaTopScorerCandidatesByPpg(candidates),
    [candidates]
  );
  const injuryById = useMemo(() => {
    const report =
      injuryReport ??
      injuryReportForMatchup(homeTeamId ?? undefined, awayTeamId ?? undefined);
    return report ? injuryStatusByPlayerId(report) : {};
  }, [injuryReport, homeTeamId, awayTeamId]);
  const restCount = Math.max(0, sorted.length - TOP_N);
  const selectedOutsideTop = useMemo(() => {
    if (!value) return false;
    const idx = sorted.findIndex((row) => isSamePick(value, row));
    return idx >= TOP_N;
  }, [sorted, value]);
  const [expanded, setExpanded] = useState(selectedOutsideTop);

  useEffect(() => {
    if (selectedOutsideTop) setExpanded(true);
  }, [selectedOutsideTop]);

  const visible = expanded ? sorted : sorted.slice(0, TOP_N);

  const onPick = (row: NbaTopScorerCandidate) => {
    if (isSamePick(value, row)) {
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
            className={`${nameBebas.className} shrink-0 text-[18px] font-bold uppercase leading-none text-white`}
            style={matchCardTeamNameStyle(true)}
          >
            {m.nbaTopScorerTitle}
          </div>
          <div
            className={`${nameOxanium.className} shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-white/50`}
          >
            {m.nbaTopScorerBonusHint}
          </div>
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-[11px] text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
          >
            {m.nbaTopScorerClear}
          </button>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <p className="text-[11px] text-white/40">{m.nbaTopScorerEmpty}</p>
      ) : (
        <div className="overflow-hidden rounded-[2px] border border-[rgba(0,245,255,0.12)] bg-[rgba(4,16,24,0.35)]">
          <div
            className={`${nameOxanium.className} flex items-center border-b border-[rgba(0,245,255,0.12)] bg-[rgba(0,245,255,0.06)] px-2 py-2 text-[8px] font-bold uppercase tracking-[0.11em] text-white/42`}
          >
            <span className="w-[26px]">#</span>
            <span className="min-w-0 flex-1">{isJa ? "選手" : "Player"}</span>
            <span className="w-[46px]">{isJa ? "チーム" : "Team"}</span>
            <span className="w-[28px] text-right">GP</span>
            <span className="w-[52px] text-right text-[#00F5FF]">PTS</span>
          </div>

          {visible.map((row, index) => {
            const rank = index + 1;
            const selected = isSamePick(value, row);
            const injuryStatus = injuryById[row.playerId];
            return (
              <button
                key={`${row.teamId}-${row.playerId}`}
                type="button"
                onClick={() => onPick(row)}
                className={[
                  "group relative flex w-full cursor-pointer items-center overflow-hidden border-t border-[rgba(0,245,255,0.08)] px-2 py-2.5 text-left transition duration-100 ease-out hover:bg-white/[0.03] active:scale-[0.985] motion-reduce:active:scale-100",
                  selected ? "bg-cyan-500/16" : "",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-75 group-active:bg-[rgba(0,245,255,0.16)]"
                />
                <span
                  className={[
                    resultStatsMetricNumClass,
                    "w-[26px] text-[15px] font-black tabular-nums",
                    rankNumberClass(rank),
                  ].join(" ")}
                  style={rankCellSkew}
                >
                  {rank}
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start justify-center pr-1">
                  <span
                    className={`${nameBebas.className} w-full truncate text-[15px] leading-tight text-white/92`}
                    style={playerNameTy}
                  >
                    {row.name}
                  </span>
                  {injuryStatus ? <InjuryChip status={injuryStatus} /> : null}
                </span>
                <span className="flex w-[46px] items-center">
                  <TeamAbbrBadge teamId={row.teamId} />
                </span>
                <span
                  className={`${nameOxanium.className} w-[28px] text-right text-[12px] font-bold tabular-nums text-white/55`}
                  style={metricCellSkew}
                >
                  {row.gp ?? "—"}
                </span>
                <span
                  className={`${nameOxanium.className} w-[52px] text-right text-[14px] font-extrabold tabular-nums text-[#00F5FF]`}
                  style={metricCellSkew}
                >
                  {fmtPpg(row.ppg)}
                </span>
              </button>
            );
          })}

          {restCount > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={`${nameOxanium.className} flex w-full items-center justify-center border-t border-[rgba(0,245,255,0.12)] py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#00F5FF] transition duration-100 hover:bg-white/[0.04] active:scale-[0.98] active:bg-[rgba(0,245,255,0.16)]`}
            >
              {expanded
                ? m.nbaTopScorerLess
                : m.nbaTopScorerMore.replace("{n}", String(restCount))}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
