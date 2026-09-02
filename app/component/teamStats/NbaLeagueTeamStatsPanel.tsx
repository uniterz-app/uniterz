"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { nameOxanium, nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import { nbaDailyStatsUpdateFootnote } from "@/lib/nba/nbaStatsUpdateSchedule";
import { isNbaLeagueStatsPreseason } from "@/lib/nba/leagueStatsPreseason";
import { leagueStatsTableEmptyCopy, teamLast10HasPlayData } from "@/lib/nba/leagueStatsEmptyState";
import NbaLeagueStatsTableEmpty from "@/app/component/stats/NbaLeagueStatsTableEmpty";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import {
  coerceModeForPhase,
  modeTabLabel,
  modesForPhase,
  NBA_LEAGUE_STATS_PHASES,
  phaseTabLabel,
  resolveLeagueTeamStatRows,
  type NbaLeagueStatsMode,
  type NbaLeagueStatsPhase,
} from "@/lib/nba/leagueStatsTableTabs";

import {
  formatMetricValue,
  metricValue,
  NBA_LEAGUE_TEAM_STAT_METRICS,
  defaultLeagueTeamStatSortDir,
  leagueMetricDef,
  leagueTeamRailGroupsForMode,
  sortLeagueTeamRows,
  teamGamesPlayed,
  formatTeamRecord,
  type NbaLeagueTeamStatSortDir,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";

type Props = {
  className?: string;
  language?: "ja" | "en";
  onSelectTeam?: (teamId: string) => void;
};

function nick(row: NbaLeagueTeamStatRow): string {
  return getMobileTeamName("nba", row.teamName).toUpperCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return `rgba(92,240,181,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 順位表・マッチカードと同じ NBA チーム短名 + 傾き */
const teamNameTy = matchCardTeamNameStyle(true);
const metricCellSkew = { transform: "skewX(-6deg)" } as const;
const rankCellSkew = { transform: "skewX(-10deg)" } as const;

function rankNumberClass(rank: number): string {
  if (rank <= 6) {
    return "text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]";
  }
  if (rank <= 10) {
    return "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]";
  }
  return "text-red-300/80";
}

function RailChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        nameOxanium.className,
        "relative w-full overflow-hidden rounded-[2px] border px-0.5 py-2 text-[9px] font-bold uppercase tracking-[0.03em]",
        active
          ? "border-[#00F5FF] text-[#050508]"
          : "border-[#00F5FF]/26 bg-transparent text-[#00F5FF]",
      ].join(" ")}
      style={
        active
          ? {
              backgroundColor: "#00F5FF",
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
            }
          : undefined
      }
    >
      <span className="relative z-[1] inline-block" style={metricCellSkew}>
        {label}
      </span>
    </button>
  );
}

function CompareBar({
  left,
  right,
  metric,
  higherIsBetter,
  onClear,
}: {
  left: NbaLeagueTeamStatRow;
  right: NbaLeagueTeamStatRow;
  metric: NbaLeagueTeamStatMetric;
  higherIsBetter: boolean;
  onClear: () => void;
}) {
  const lv = metricValue(left, metric);
  const rv = metricValue(right, metric);
  const leftWins = higherIsBetter ? lv > rv : lv < rv;
  const rightWins = higherIsBetter ? rv > lv : rv < lv;
  const leftColor = getTeamPrimaryColor("nba", left.teamId) ?? "#e8edf5";
  const rightColor = getTeamPrimaryColor("nba", right.teamId) ?? "#e8edf5";
  const meta = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === metric) ??
    leagueMetricDef(metric);

  return (
    <div className="rounded-[2px] border border-[rgba(0,245,255,0.28)] bg-[rgba(4,16,24,0.97)] px-3 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45),0_0_24px_rgba(0,245,255,0.12)] backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={[
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-[#00F5FF]/85",
          ].join(" ")}
        >
          Compare · {meta?.short ?? metric}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#00F5FF]/25 text-white/60 hover:text-white"
          aria-label="Clear compare"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="min-w-0 text-left">
          <div
            className={[
              nameBebas.className,
              "truncate text-[12px] leading-tight text-white",
            ].join(" ")}
            style={{ ...teamNameTy, color: leftColor }}
          >
            {nick(left)}
          </div>
          <div
            className={[
              resultStatsMetricNumClass,
              "mt-0.5 text-[22px] font-black leading-none tabular-nums",
              leftWins ? "text-[#00F5FF]" : "text-white/75",
            ].join(" ")}
          >
            {formatMetricValue(metric, lv)}
          </div>
          <div className="mt-1 text-[10px] tabular-nums text-white/45">
            {left.wins}-{left.losses} · NET {formatMetricValue("netrtg", left.netrtg)}
          </div>
        </div>

        <div
          className={[
            nameOxanium.className,
            "pb-3 text-[9px] font-black tracking-[0.2em] text-white/35",
          ].join(" ")}
        >
          VS
        </div>

        <div className="min-w-0 text-right">
          <div
            className={[
              nameBebas.className,
              "truncate text-[12px] leading-tight text-white",
            ].join(" ")}
            style={{ ...teamNameTy, color: rightColor }}
          >
            {nick(right)}
          </div>
          <div
            className={[
              resultStatsMetricNumClass,
              "mt-0.5 text-[22px] font-black leading-none tabular-nums",
              rightWins ? "text-[#00F5FF]" : "text-white/75",
            ].join(" ")}
          >
            {formatMetricValue(metric, rv)}
          </div>
          <div className="mt-1 text-[10px] tabular-nums text-white/45">
            {right.wins}-{right.losses} · NET {formatMetricValue("netrtg", right.netrtg)}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-white/8 pt-2.5">
        {(
          [
            ["efgPct", "EFG"],
            ["fg3Pct", "3P%"],
            ["fg3a", "3PA"],
            ["tovPct", "TOV"],
            ["ortg", "ORTG"],
            ["drtg", "DRTG"],
          ] as const
        ).map(([key, label]) => {
          const a = metricValue(left, key);
          const b = metricValue(right, key);
          const def = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === key)!;
          const hi = def.higherIsBetter ? a > b : a < b;
          const hj = def.higherIsBetter ? b > a : b < a;
          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] tabular-nums"
            >
              <span
                className={[
                  resultStatsMetricNumClass,
                  "text-right font-bold",
                  hi ? "text-white" : "text-white/45",
                ].join(" ")}
              >
                {formatMetricValue(key, a)}
              </span>
              <span
                className={[
                  nameOxanium.className,
                  "w-10 text-center text-[8px] font-extrabold tracking-[0.14em] text-white/35",
                ].join(" ")}
              >
                {label}
              </span>
              <span
                className={[
                  resultStatsMetricNumClass,
                  "text-left font-bold",
                  hj ? "text-white" : "text-white/45",
                ].join(" ")}
              >
                {formatMetricValue(key, b)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NbaLeagueTeamStatsPanel({
  className = "",
  language = "ja",
  onSelectTeam,
}: Props) {
  const isJa = language === "ja";
  const reduceMotion = useReducedMotion();
  const { bundle, loading } = useLeagueTeamStatsBundle();
  const isPreseason = isNbaLeagueStatsPreseason();
  const updateFootnote = nbaDailyStatsUpdateFootnote(isJa ? "ja" : "en", bundle.asOfLabel, {
    preseason: isPreseason,
  });
  const [phase, setPhase] = useState<NbaLeagueStatsPhase>("season");
  const [mode, setMode] = useState<NbaLeagueStatsMode>("per_game");
  const groups = useMemo(() => leagueTeamRailGroupsForMode(mode), [mode]);
  const [metric, setMetric] = useState<NbaLeagueTeamStatMetric>("winPct");
  const [sortDir, setSortDir] = useState<NbaLeagueTeamStatSortDir>(() =>
    defaultLeagueTeamStatSortDir(leagueMetricDef("winPct").higherIsBetter)
  );
  const [picked, setPicked] = useState<string[]>([]);

  const metricMeta = leagueMetricDef(metric);
  const activeGroupId =
    groups.find((g) => g.metrics.some((m) => m.id === metric))?.id ?? "basic";

  function applyMode(next: NbaLeagueStatsMode) {
    setMode(next);
    const nextGroups = leagueTeamRailGroupsForMode(next);
    const allowed = new Set(
      nextGroups.flatMap((g) => g.metrics.map((m) => m.id))
    );
    if (!allowed.has(metric)) {
      const fallback = nextGroups[0]?.metrics[0]?.id;
      if (fallback) applyMetric(fallback);
    }
  }

  function applyMetric(next: NbaLeagueTeamStatMetric) {
    const meta = leagueMetricDef(next);
    setMetric(next);
    setSortDir(defaultLeagueTeamStatSortDir(meta.higherIsBetter));
  }

  function toggleSortDir() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }

  const modeOptions = modesForPhase(phase);
  const rows = useMemo(() => {
    const base = resolveLeagueTeamStatRows({
      phase,
      mode,
      season: bundle.season,
      last10: bundle.last10,
    });
    return sortLeagueTeamRows(base, metric, sortDir);
  }, [bundle, phase, mode, metric, sortDir]);

  const pickedRows = picked
    .map((id) => rows.find((r) => r.teamId === id) ?? bundle.season.find((r) => r.teamId === id))
    .filter(Boolean) as NbaLeagueTeamStatRow[];

  const emptyCopy = leagueStatsTableEmptyCopy(isJa ? "ja" : "en", mode);
  const showEmptyTable =
    !loading &&
    (mode === "last10"
      ? !teamLast10HasPlayData(bundle.last10)
      : rows.length === 0);

  function togglePick(teamId: string) {
    setPicked((prev) => {
      if (prev.includes(teamId)) return prev.filter((id) => id !== teamId);
      if (prev.length >= 2) return [prev[1]!, teamId];
      return [...prev, teamId];
    });
  }

  return (
    <div
      className={[
        "relative flex h-[calc(100svh-13rem)] min-h-[28rem] flex-col text-white",
        loading ? "pointer-events-none opacity-60" : "",
        className,
      ].join(" ")}
    >
      <header className="mb-2 shrink-0 space-y-1.5 px-0.5">
        <p
          className={[
            nameOxanium.className,
            "text-right text-[9px] font-bold uppercase tracking-[0.16em] text-[#00F5FF]/45",
          ].join(" ")}
        >
          {updateFootnote}
        </p>
                <div className="space-y-1.5">
          <CyberSlantedTabBar fill>
            {NBA_LEAGUE_STATS_PHASES.map((p) => (
              <CyberSlantedTab
                key={p}
                label={phaseTabLabel(p)}
                active={phase === p}
                onClick={() => {
                  setPhase(p);
                  setMode(coerceModeForPhase(p, mode));
                }}
                compact
                fontWeight={700}
              />
            ))}
          </CyberSlantedTabBar>
          <CyberSlantedTabBar fill>
            {modeOptions.map((m) => (
              <CyberSlantedTab
                key={m}
                label={modeTabLabel(m)}
                active={mode === m}
                onClick={() => applyMode(m)}
                compact
                fontWeight={700}
              />
            ))}
          </CyberSlantedTabBar>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[22%] shrink-0 overflow-y-auto border-r border-white/42 bg-[rgba(4,14,22,0.55)] px-1.5 pb-24 pt-1">
          {groups.map((group, index) => {
            const groupActive = group.id === activeGroupId;
            return (
              <div key={group.id} className="mb-2.5 space-y-1">
                {index === 1 ? (
                  <p
                    className={`${nameOxanium.className} mb-1 mt-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-white/32`}
                  >
                    ADVANCED
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const first = group.metrics[0];
                    if (first) applyMetric(first.id);
                  }}
                  className={[
                    nameOxanium.className,
                    "px-0.5 text-left text-[8px] font-extrabold uppercase tracking-[0.1em]",
                    groupActive ? "text-[#00F5FF]" : "text-[#00F5FF]/42",
                  ].join(" ")}
                >
                  {group.short}
                </button>
                {group.metrics.map((m) => (
                  <RailChip
                    key={m.id}
                    active={metric === m.id}
                    label={m.short}
                    onClick={() => applyMetric(m.id)}
                  />
                ))}
              </div>
            );
          })}
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto pb-24 pl-2.5 pr-3">
          <p
            className={`${nameOxanium.className} mb-1.5 line-clamp-2 text-[12px] leading-[17px] text-[#00F5FF]/70`}
          >
            {isJa ? metricMeta.hintJa : metricMeta.hintEn}
          </p>
          {onSelectTeam ? null : (
            <p className="mb-1.5 text-[10px] text-[#00F5FF]/45">
              {picked.length === 0
                ? "比較: 0/2"
                : picked.length === 1
                  ? "比較: もう1チーム選択"
                  : "比較: 2/2"}
            </p>
          )}

          {showEmptyTable ? (
            <NbaLeagueStatsTableEmpty copy={emptyCopy} />
          ) : (
          <div className="overflow-hidden rounded-[2px] border border-[rgba(0,245,255,0.16)] bg-[rgba(4,16,24,0.35)]">
            <div
              className={[
                nameOxanium.className,
                "flex items-center border-b border-[rgba(0,245,255,0.12)] bg-[rgba(0,245,255,0.06)] px-2 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-white/42",
              ].join(" ")}
            >
              <span className="w-[26px]">#</span>
              <button
                type="button"
                onClick={toggleSortDir}
                className="flex min-w-0 flex-1 items-center gap-1 text-left"
                aria-label={
                  isJa
                    ? sortDir === "desc"
                      ? "降順。タップで昇順"
                      : "昇順。タップで降順"
                    : sortDir === "desc"
                      ? "Descending. Tap for ascending"
                      : "Ascending. Tap for descending"
                }
              >
                <span>Team</span>
                <span>
                  {isJa
                    ? sortDir === "desc"
                      ? "降順"
                      : "昇順"
                    : sortDir === "desc"
                      ? "hi→lo"
                      : "lo→hi"}
                </span>
                {sortDir === "desc" ? (
                  <ArrowDown className="h-2.5 w-2.5 shrink-0 text-[#00F5FF]" />
                ) : (
                  <ArrowUp className="h-2.5 w-2.5 shrink-0 text-[#00F5FF]" />
                )}
              </button>
              {metric === "winPct" ? (
                <>
                  <span className="w-[44px] text-right">W-L</span>
                  <span className="w-14 text-right text-[#00F5FF]">W%</span>
                </>
              ) : (
                <>
                  <span className="w-[28px] text-right">GP</span>
                  <span className="w-14 text-right text-[#00F5FF]">
                    {metricMeta.short}
                  </span>
                </>
              )}
            </div>

            <ul>
              {rows.map((row, index) => {
                const rank = index + 1;
                const selected = picked.includes(row.teamId);
                const primary = metricValue(row, metric);
                const teamPrimary =
                  getTeamPrimaryColor("nba", row.teamId) ?? "#5cf0b5";
                return (
                  <motion.li
                    key={row.teamId}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.18,
                      delay: reduceMotion ? 0 : Math.min(index, 12) * 0.012,
                    }}
                    className="relative overflow-hidden border-t border-[rgba(0,245,255,0.08)]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onSelectTeam
                          ? onSelectTeam(row.teamId)
                          : togglePick(row.teamId)
                      }
                      className={[
                        "group relative flex w-full cursor-pointer items-center px-2 py-2.5 text-left transition-[transform,filter] duration-100 ease-out active:scale-[0.985] motion-reduce:active:scale-100",
                        !onSelectTeam && selected
                          ? "bg-[rgba(0,56,72,0.55)]"
                          : "bg-transparent hover:bg-white/[0.03]",
                      ].join(" ")}
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${hexToRgba(teamPrimary, 0.18)} 0%, ${hexToRgba(teamPrimary, 0.1)} 50%, transparent 100%)`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-transparent transition-colors duration-75 group-active:bg-[rgba(0,245,255,0.16)]"
                      />
                      <span
                        className={[
                          resultStatsMetricNumClass,
                          "w-[26px] text-[15px] font-black tabular-nums leading-none",
                          rankNumberClass(rank),
                        ].join(" ")}
                        style={rankCellSkew}
                      >
                        {rank}
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={[
                            nameBebas.className,
                            "truncate text-[17px] leading-tight text-white",
                          ].join(" ")}
                          style={teamNameTy}
                        >
                          {nick(row)}
                        </span>
                        {!onSelectTeam && selected ? (
                          <span
                            className={[
                              nameOxanium.className,
                              "shrink-0 text-[8px] font-bold tracking-[0.12em] text-[#00F5FF]",
                            ].join(" ")}
                          >
                            {picked.indexOf(row.teamId) + 1}
                          </span>
                        ) : null}
                      </span>
                      {metric === "winPct" ? (
                        <span
                          className={`${nameOxanium.className} w-[44px] text-right text-[12px] font-bold tabular-nums text-white/55`}
                          style={metricCellSkew}
                        >
                          {formatTeamRecord(row)}
                        </span>
                      ) : (
                        <span
                          className={`${nameOxanium.className} w-[28px] text-right text-[12px] font-bold tabular-nums text-white/55`}
                          style={metricCellSkew}
                        >
                          {teamGamesPlayed(row)}
                        </span>
                      )}
                      <span
                        className={[
                          resultStatsMetricNumClass,
                          "w-14 text-right text-[14px] font-black tabular-nums text-[#00F5FF]",
                        ].join(" ")}
                        style={metricCellSkew}
                      >
                        {formatMetricValue(metric, primary)}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {!onSelectTeam && pickedRows.length === 2 ? (
          <motion.div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
            initial={reduceMotion ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: 16, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-auto mx-auto w-full max-w-lg">
              <CompareBar
                left={pickedRows[0]!}
                right={pickedRows[1]!}
                metric={metric}
                higherIsBetter={metricMeta.higherIsBetter}
                onClear={() => setPicked([])}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
