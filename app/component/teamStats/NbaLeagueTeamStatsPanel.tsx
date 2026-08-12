"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ArrowDown, ArrowUp } from "lucide-react";
import { nameOxanium, nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { useLeagueTeamStatsBundle } from "@/lib/nba/useLeagueTeamStatsBundle";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import {
  formatMetricValue,
  metricValue,
  NBA_LEAGUE_TEAM_STAT_METRICS,
  NBA_LEAGUE_TEAM_STAT_METRIC_ROWS,
  sortLeagueTeamRows,
  defaultLeagueTeamStatSortDir,
  type NbaLeagueTeamStatSortDir,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
  type NbaLeagueTeamStatWindow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";

type ConfFilter = "all" | NbaConferenceId;

type Props = {
  className?: string;
  language?: "ja" | "en";
  onSelectTeam?: (teamId: string) => void;
};

function nick(row: NbaLeagueTeamStatRow): string {
  return getMobileTeamName("nba", row.teamName).toUpperCase();
}

/** 順位表・マッチカードと同じ NBA チーム短名 */
const teamNameTy = bracketMarketTeamTypography(true);

function rankNumberClass(rank: number): string {
  if (rank <= 6) {
    return "text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]";
  }
  if (rank <= 10) {
    return "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]";
  }
  return "text-red-300/80";
}

function MetricChip({
  active,
  label,
  onClick,
  compact,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        nameOxanium.className,
        "w-full rounded-[2px] border px-1 py-1.5 text-[9px] font-bold uppercase tracking-[0.08em] transition sm:text-[10px] sm:tracking-[0.12em]",
        compact ? "py-1" : "py-1.5",
        active
          ? "border-[#00F5FF] bg-[#00F5FF] text-[#050508]"
          : "border-[#00F5FF]/30 bg-[rgba(4,20,30,0.72)] text-[#00F5FF] hover:border-[#00F5FF]/50",
      ].join(" ")}
    >
      {label}
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
  const meta = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === metric);

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
  const [windowId, setWindowId] = useState<NbaLeagueTeamStatWindow>("season");
  const [conf, setConf] = useState<ConfFilter>("all");
  const [metric, setMetric] = useState<NbaLeagueTeamStatMetric>("winPct");
  const [sortDir, setSortDir] = useState<NbaLeagueTeamStatSortDir>(() =>
    defaultLeagueTeamStatSortDir(
      NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === "winPct")!
        .higherIsBetter
    )
  );
  const [picked, setPicked] = useState<string[]>([]);

  const metricMeta = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === metric)!;

  function selectMetric(next: NbaLeagueTeamStatMetric) {
    const meta = NBA_LEAGUE_TEAM_STAT_METRICS.find((m) => m.id === next)!;
    setMetric(next);
    setSortDir(defaultLeagueTeamStatSortDir(meta.higherIsBetter));
  }

  function toggleSortDir() {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }

  const rows = useMemo(() => {
    const base = windowId === "season" ? bundle.season : bundle.last10;
    const filtered =
      conf === "all" ? base : base.filter((r) => r.conference === conf);
    return sortLeagueTeamRows(filtered, metric, sortDir);
  }, [bundle, windowId, conf, metric, sortDir]);

  const pickedRows = picked
    .map((id) => rows.find((r) => r.teamId === id) ?? bundle.season.find((r) => r.teamId === id))
    .filter(Boolean) as NbaLeagueTeamStatRow[];

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
        "relative pb-36",
        loading ? "pointer-events-none opacity-60" : "",
        className,
      ].join(" ")}
    >
      <header className="mb-4 space-y-1.5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[12px] leading-snug text-white/55">
            リーグ全体を指標で並べ替え。行をタップして最大 2 チームを比較。
          </p>
          <span
            className={[
              nameOxanium.className,
              "shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-[#00F5FF]/45",
            ].join(" ")}
          >
            {bundle.asOfLabel}
          </span>
        </div>
      </header>

      <div className="mb-3">
        <CyberSlantedTabBar fill>
          <CyberSlantedTab
            label="SEASON"
            active={windowId === "season"}
            onClick={() => setWindowId("season")}
            compact
            fontWeight={700}
          />
          <CyberSlantedTab
            label="LAST 10"
            active={windowId === "last10"}
            onClick={() => setWindowId("last10")}
            compact
            fontWeight={700}
          />
        </CyberSlantedTabBar>
      </div>

      <div className="mb-3">
        <CyberSlantedTabBar fill>
          {(
            [
              ["all", "ALL"],
              ["east", "EAST"],
              ["west", "WEST"],
            ] as const
          ).map(([id, label]) => (
            <CyberSlantedTab
              key={id}
              label={label}
              active={conf === id}
              onClick={() => setConf(id)}
              compact
              fontWeight={700}
            />
          ))}
        </CyberSlantedTabBar>
      </div>

      <div className="mb-3 space-y-1.5">
        {NBA_LEAGUE_TEAM_STAT_METRIC_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid grid-cols-3 gap-1.5 sm:grid-cols-6"
          >
            {row.map((m) => (
              <MetricChip
                key={m.id}
                active={metric === m.id}
                label={m.short}
                onClick={() => selectMetric(m.id)}
                compact
              />
            ))}
          </div>
        ))}
      </div>

      <p
        className={[
          nameOxanium.className,
          "mb-2 min-h-[2.5rem] text-[11px] leading-snug text-[#00F5FF]/70",
        ].join(" ")}
      >
        {isJa ? metricMeta.hintJa : metricMeta.hintEn}
      </p>

      <div className="mb-2 flex items-center justify-between px-0.5">
        <button
          type="button"
          onClick={toggleSortDir}
          className={[
            nameOxanium.className,
            "inline-flex items-center gap-1 rounded-[2px] border border-transparent py-0.5 pr-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/40 transition hover:border-[#00F5FF]/25 hover:text-[#00F5FF]/75",
          ].join(" ")}
          aria-label={
            isJa
              ? sortDir === "desc"
                ? "降順。タップで昇順に切り替え"
                : "昇順。タップで降順に切り替え"
              : sortDir === "desc"
                ? "Descending. Tap for ascending"
                : "Ascending. Tap for descending"
          }
        >
          <span>
            Sort · {metricMeta.label}
            {isJa
              ? sortDir === "desc"
                ? " · 降順"
                : " · 昇順"
              : sortDir === "desc"
                ? " · high→low"
                : " · low→high"}
          </span>
          {sortDir === "desc" ? (
            <ArrowDown className="h-3 w-3 shrink-0 text-[#00F5FF]/70" aria-hidden />
          ) : (
            <ArrowUp className="h-3 w-3 shrink-0 text-[#00F5FF]/70" aria-hidden />
          )}
        </button>
        {onSelectTeam ? null : (
          <span className="text-[10px] text-[#00F5FF]/45">
            {picked.length === 0
              ? "比較: 0/2"
              : picked.length === 1
                ? "比較: もう1チーム選択"
                : "比較: 2/2"}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-[2px] border border-[rgba(0,245,255,0.16)] bg-[rgba(4,16,24,0.35)]">
        <div
          className={[
            nameOxanium.className,
            "grid grid-cols-[28px_minmax(0,1.2fr)_64px_52px_52px] gap-1 border-b border-[rgba(0,245,255,0.12)] bg-[rgba(0,245,255,0.06)] px-2 py-2 text-[8px] font-bold uppercase tracking-[0.12em] text-white/42",
          ].join(" ")}
        >
          <span>#</span>
          <span>Team</span>
          <button
            type="button"
            onClick={toggleSortDir}
            className={[
              nameOxanium.className,
              "inline-flex items-center justify-end gap-0.5 text-right text-[#00F5FF] transition hover:text-[#00F5FF]",
            ].join(" ")}
            aria-label={
              isJa
                ? `${metricMeta.short}で並べ替え方向を切り替え`
                : `Toggle sort on ${metricMeta.short}`
            }
          >
            {metricMeta.short}
            {sortDir === "desc" ? (
              <ArrowDown className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />
            ) : (
              <ArrowUp className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />
            )}
          </button>
          <span className="text-right">W-L</span>
          <span className="text-right">NET</span>
        </div>

        <ul className="divide-y divide-white/[0.06]">
          {rows.map((row, index) => {
            const rank = index + 1;
            const selected = picked.includes(row.teamId);
            const primary = metricValue(row, metric);
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
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectTeam
                      ? onSelectTeam(row.teamId)
                      : togglePick(row.teamId)
                  }
                  className={[
                    "grid w-full grid-cols-[28px_minmax(0,1.2fr)_64px_52px_52px] items-center gap-1 px-2 py-2.5 text-left transition",
                    !onSelectTeam && selected
                      ? "bg-[rgba(0,56,72,0.55)]"
                      : "bg-transparent hover:bg-white/[0.03] active:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "w-7 text-[11px] font-black tabular-nums leading-none",
                      rankNumberClass(rank),
                    ].join(" ")}
                  >
                    {rank}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={[
                        nameBebas.className,
                        "truncate text-[15px] leading-tight text-white",
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
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "text-right text-[13px] font-black tabular-nums text-[#00F5FF]",
                    ].join(" ")}
                  >
                    {formatMetricValue(metric, primary)}
                  </span>
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "text-right text-[11px] font-semibold tabular-nums text-white/55",
                    ].join(" ")}
                  >
                    {row.wins}-{row.losses}
                  </span>
                  <span
                    className={[
                      resultStatsMetricNumClass,
                      "text-right text-[11px] font-semibold tabular-nums text-white/55",
                    ].join(" ")}
                  >
                    {formatMetricValue("netrtg", row.netrtg)}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
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
