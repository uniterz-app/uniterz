"use client";

/**
 * リーグ視点 Player Stats Leaders（モック）— Native `NbaLeaguePlayerStatLeadersPanelNative` 相当
 */
import { useMemo, useState } from "react";
import { nameOxanium, nameBebas, resultStatsMetricNumClass } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import {
  NBA_PLAYER_STAT_LEADER_METRICS,
  NBA_PLAYER_STAT_LEADER_METRIC_ROWS,
  formatPlayerLeaderValue,
  getNbaPlayerStatLeadersMock,
  type NbaPlayerStatLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

type WindowId = "season" | "last10";

type Props = {
  language?: "ja" | "en";
  onSelectPlayer?: (playerId: string) => void;
};

const playerNameTy = matchCardTeamNameStyle(true);
const rankCellSkew = { transform: "skewX(-10deg)" } as const;
const metricCellSkew = { transform: "skewX(-6deg)" } as const;

function MetricChip({
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
        "w-full rounded-[2px] border px-1 py-2 text-[9px] font-bold uppercase tracking-[0.06em] transition",
        active
          ? "border-[#00F5FF] bg-[#00F5FF] text-[#050508]"
          : "border-[#00F5FF]/28 bg-[rgba(4,20,30,0.72)] text-[#00F5FF] hover:border-[#00F5FF]/50",
      ].join(" ")}
      style={metricCellSkew}
    >
      {label}
    </button>
  );
}

export default function NbaLeaguePlayerStatLeadersPanel({
  language = "ja",
  onSelectPlayer,
}: Props) {
  const isJa = language === "ja";
  const bundle = useMemo(() => getNbaPlayerStatLeadersMock(), []);
  const [windowId, setWindowId] = useState<WindowId>("season");
  const [metric, setMetric] = useState<NbaPlayerStatLeaderMetric>("pts");
  const metricMeta =
    NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === metric) ??
    NBA_PLAYER_STAT_LEADER_METRICS[0]!;
  const leaders = bundle[windowId][metric] ?? [];

  return (
    <div className="space-y-0 pb-36 text-white">
      <header className="mb-3 space-y-1.5">
        <p
          className={`${nameOxanium.className} text-right text-[9px] font-bold uppercase tracking-[0.16em] text-[#00F5FF]/45`}
        >
          {bundle.asOfLabel}
        </p>
        <p
          className={`${nameOxanium.className} text-[11px] leading-snug text-white/52`}
        >
          {isJa
            ? "BallDontLie Leaders 相当の stat_type（モック）。"
            : "Mock aligned to BallDontLie Leaders stat_type."}
        </p>
      </header>

      <div className="mb-2.5">
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

      <div className="mb-2 space-y-1.5">
        {NBA_PLAYER_STAT_LEADER_METRIC_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-6 gap-1.5">
            {row.map((m) => (
              <MetricChip
                key={m.id}
                active={metric === m.id}
                label={m.short}
                onClick={() => setMetric(m.id)}
              />
            ))}
            {Array.from({ length: Math.max(0, 6 - row.length) }).map((_, i) => (
              <div key={`pad-${rowIdx}-${i}`} aria-hidden />
            ))}
          </div>
        ))}
      </div>

      <p
        className={`${nameOxanium.className} mb-2.5 min-h-[34px] text-[11px] leading-snug text-[#00F5FF]/70`}
      >
        {isJa ? metricMeta.hintJa : metricMeta.hintEn}
      </p>

      <div className="mb-2 flex items-center justify-between px-0.5">
        <span
          className={`${nameOxanium.className} text-[9px] font-bold uppercase tracking-[0.13em] text-white/42`}
        >
          {isJa ? "リーダー" : "Leaders"} · {metricMeta.short}
        </span>
        <span
          className={`${nameOxanium.className} text-[10px] font-bold text-[#00F5FF]/35`}
        >
          Top 30
        </span>
      </div>

      <div className="overflow-hidden rounded-[2px] border border-[rgba(0,245,255,0.12)] bg-[rgba(4,16,24,0.35)]">
        <div
          className={`${nameOxanium.className} flex items-center gap-1 border-b border-[rgba(0,245,255,0.12)] bg-[rgba(0,245,255,0.06)] px-2 py-2 text-[8px] font-bold uppercase tracking-[0.11em] text-white/42`}
        >
          <span className="w-7">#</span>
          <span className="min-w-0 flex-[1.2]">
            {isJa ? "選手" : "Player"}
          </span>
          <span className="w-[46px]">{isJa ? "チーム" : "Team"}</span>
          <span className="w-9 text-right">{isJa ? "試合" : "GP"}</span>
          <span className="w-14 text-right text-[#00F5FF]">
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
              className="flex w-full items-center gap-1 border-t border-[rgba(0,245,255,0.08)] px-2 py-2.5 text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
            >
              <span
                className={[
                  resultStatsMetricNumClass,
                  "w-7 text-[13px] font-black tabular-nums",
                  rank <= 6 ? "text-[#00F5FF]" : "text-white/55",
                ].join(" ")}
                style={rankCellSkew}
              >
                {rank}
              </span>
              <span
                className={[
                  nameBebas.className,
                  "min-w-0 flex-[1.2] truncate text-[18px] leading-tight text-white/92",
                ].join(" ")}
                style={playerNameTy}
              >
                {row.playerName}
              </span>
              <span className="flex w-[46px] items-center">
                <TeamAbbrBadge teamId={row.teamId} />
              </span>
              <span
                className={`${nameOxanium.className} w-9 text-right text-[12px] font-bold tabular-nums text-white/55`}
                style={metricCellSkew}
              >
                {row.gamesPlayed}
              </span>
              <span
                className={`${nameOxanium.className} w-14 text-right text-[12px] font-extrabold tabular-nums text-[#00F5FF]`}
                style={metricCellSkew}
              >
                {formatPlayerLeaderValue(metric, row.value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
