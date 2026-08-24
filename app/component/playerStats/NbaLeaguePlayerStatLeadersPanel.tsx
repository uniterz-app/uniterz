"use client";

/**
 * リーグ視点 Player Stats Leaders — Native `NbaLeaguePlayerStatLeadersPanelNative` 相当
 */
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { nameOxanium, nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import {
  coerceModeForPhase,
  modeTabLabel,
  modesForPhase,
  phaseTabLabel,
  resolvePlayerStatLeaderRows,
  type NbaLeagueStatsMode,
  type NbaLeagueStatsPhase,
} from "@/lib/nba/leagueStatsTableTabs";

import {
  formatPlayerLeaderValue,
  leaguePlayerRailGroupsForMode,
  playerLeaderMetricDef,
  type NbaPlayerStatLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { usePlayerStatLeadersBundle } from "@/lib/nba/usePlayerStatLeadersBundle";

type SortDir = "desc" | "asc";

type Props = {
  language?: "ja" | "en";
  onSelectPlayer?: (playerId: string) => void;
};

const playerNameTy = matchCardTeamNameStyle(true);
const rankCellSkew = { transform: "skewX(-10deg)" } as const;
const metricCellSkew = { transform: "skewX(-6deg)" } as const;
const labelSkew = { transform: "skewX(-6deg)" } as const;

function defaultSortDir(higherIsBetter: boolean): SortDir {
  return higherIsBetter ? "desc" : "asc";
}

function rankNumberClass(rank: number): string {
  if (rank <= 6) return "text-emerald-300";
  if (rank <= 10) return "text-amber-300";
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
      <span className="relative z-[1] inline-block" style={labelSkew}>
        {label}
      </span>
    </button>
  );
}

export default function NbaLeaguePlayerStatLeadersPanel({
  language = "ja",
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  const { bundle, loading } = usePlayerStatLeadersBundle();
  const [phase, setPhase] = useState<NbaLeagueStatsPhase>("season");
  const [mode, setMode] = useState<NbaLeagueStatsMode>("per_game");
  const groups = useMemo(() => leaguePlayerRailGroupsForMode(mode), [mode]);
  const [metric, setMetric] = useState<NbaPlayerStatLeaderMetric>("pts");
  const [sortDir, setSortDir] = useState<SortDir>(() =>
    defaultSortDir(playerLeaderMetricDef("pts").higherIsBetter)
  );

  const metricMeta = playerLeaderMetricDef(metric);
  const activeGroupId =
    groups.find((g) => g.metrics.some((m) => m.id === metric))?.id ?? "basic";

  function applyMode(next: NbaLeagueStatsMode) {
    setMode(next);
    const nextGroups = leaguePlayerRailGroupsForMode(next);
    const allowed = new Set(
      nextGroups.flatMap((g) => g.metrics.map((m) => m.id))
    );
    if (!allowed.has(metric)) {
      const fallback = nextGroups[0]?.metrics[0]?.id;
      if (fallback) applyMetric(fallback);
    }
  }

  function applyMetric(next: NbaPlayerStatLeaderMetric) {
    const meta = playerLeaderMetricDef(next);
    setMetric(next);
    setSortDir(defaultSortDir(meta.higherIsBetter));
  }

  const modeOptions = modesForPhase(phase);
  const leaders = useMemo(() => {
    const list = resolvePlayerStatLeaderRows({
      phase,
      mode,
      metric,
      season: bundle.season[metric] ?? [],
      last10: bundle.last10[metric] ?? [],
    });
    return sortDir === "asc" ? [...list].reverse() : list;
  }, [bundle, phase, mode, metric, sortDir]);

  return (
    <div
      className={[
        "flex h-[calc(100svh-13rem)] min-h-[28rem] flex-col text-white",
        loading ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <header className="mb-2 shrink-0 space-y-1.5 px-0.5">
        <p
          className={`${nameOxanium.className} text-right text-[9px] font-bold uppercase tracking-[0.16em] text-[#00F5FF]/45`}
        >
          {bundle.asOfLabel}
        </p>
                <div className="space-y-1.5">
          <CyberSlantedTabBar fill>
            <CyberSlantedTab
              label={phaseTabLabel("season")}
              active={phase === "season"}
              onClick={() => {
                setPhase("season");
                setMode(coerceModeForPhase("season", mode));
              }}
              compact
              fontWeight={700}
            />
            <CyberSlantedTab
              label={phaseTabLabel("playoffs")}
              active={phase === "playoffs"}
              onClick={() => {
                setPhase("playoffs");
                setMode(coerceModeForPhase("playoffs", mode));
              }}
              compact
              fontWeight={700}
            />
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

          <div className="overflow-hidden rounded-[2px] border border-[rgba(0,245,255,0.12)] bg-[rgba(4,16,24,0.35)]">
            <div
              className={`${nameOxanium.className} flex items-center border-b border-[rgba(0,245,255,0.12)] bg-[rgba(0,245,255,0.06)] px-2 py-2 text-[8px] font-bold uppercase tracking-[0.11em] text-white/42`}
            >
              <span className="w-[26px]">#</span>
              <button
                type="button"
                onClick={() =>
                  setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                }
                className="flex min-w-0 flex-1 items-center gap-1 text-left"
              >
                <span>{isJa ? "選手" : "Player"}</span>
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
              <span className="w-[46px]">{isJa ? "チーム" : "Team"}</span>
              <span className="w-[28px] text-right">GP</span>
              <span className="w-[52px] text-right text-[#00F5FF]">
                {metricMeta.short}
              </span>
            </div>

            {leaders.map((row, index) => {
              const rank = index + 1;
              return (
                <button
                  key={row.playerId}
                  type="button"
                  onClick={() => onSelectPlayer?.(row.playerId)}
                  className="group relative flex w-full cursor-pointer items-center overflow-hidden border-t border-[rgba(0,245,255,0.08)] px-2 py-2.5 text-left transition-[transform] duration-100 ease-out hover:bg-white/[0.03] active:scale-[0.985] motion-reduce:active:scale-100"
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
                  <span
                    className={[
                      nameBebas.className,
                      "min-w-0 flex-1 truncate text-[15px] leading-tight text-white/92",
                    ].join(" ")}
                    style={playerNameTy}
                  >
                    {formatNbaPlayerListName(row.playerName, row.playerId)}
                  </span>
                  <span className="flex w-[46px] items-center">
                    <TeamAbbrBadge teamId={row.teamId} />
                  </span>
                  <span
                    className={`${nameOxanium.className} w-[28px] text-right text-[12px] font-bold tabular-nums text-white/55`}
                    style={metricCellSkew}
                  >
                    {row.gamesPlayed}
                  </span>
                  <span
                    className={`${nameOxanium.className} w-[52px] text-right text-[14px] font-extrabold tabular-nums text-[#00F5FF]`}
                    style={metricCellSkew}
                  >
                    {formatPlayerLeaderValue(metric, row.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
