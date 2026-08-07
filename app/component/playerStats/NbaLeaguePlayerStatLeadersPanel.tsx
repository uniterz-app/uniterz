"use client";

/**
 * リーグ視点 Player Stats Leaders（モック）— Native `NbaLeaguePlayerStatLeadersPanelNative` 相当
 */
import { useMemo, useState } from "react";
import { nameOxanium } from "@/lib/fonts";
import { TEAM_SHORT } from "@/lib/team-short";
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
    <div className="space-y-4 text-white">
      <div className="flex items-end justify-between gap-3">
        <p
          className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em] text-white/40`}
        >
          {bundle.asOfLabel}
        </p>
        <CyberSlantedTabBar className="shrink-0">
          <CyberSlantedTab
            active={windowId === "season"}
            onClick={() => setWindowId("season")}
            label={isJa ? "シーズン" : "Season"}
            compact
          />
          <CyberSlantedTab
            active={windowId === "last10"}
            onClick={() => setWindowId("last10")}
            label={isJa ? "直近10" : "Last 10"}
            compact
          />
        </CyberSlantedTabBar>
      </div>

      <div className="space-y-1.5">
        {NBA_PLAYER_STAT_LEADER_METRIC_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {row.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                className={[
                  nameOxanium.className,
                  "rounded-[2px] border px-1 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] transition",
                  metric === m.id
                    ? "border-[#00F5FF] bg-[#00F5FF] text-[#050508]"
                    : "border-[#00F5FF]/30 bg-[rgba(4,20,30,0.72)] text-[#00F5FF]",
                ].join(" ")}
              >
                {m.short}
              </button>
            ))}
          </div>
        ))}
      </div>

      <p
        className={`${nameOxanium.className} text-[10px] leading-snug text-white/45`}
      >
        {isJa ? metricMeta.hintJa : metricMeta.hintEn}
      </p>

      <div className="overflow-hidden border border-[rgba(0,245,255,0.28)] bg-black/40">
        <div
          className={`${nameOxanium.className} flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40`}
        >
          <span className="w-8">#</span>
          <span className="min-w-0 flex-1">Player</span>
          <span className="w-12 text-right">Team</span>
          <span className="w-14 text-right">{metricMeta.short}</span>
        </div>
        {leaders.map((row, i) => (
          <button
            key={`${row.playerId}-${i}`}
            type="button"
            onClick={() => onSelectPlayer?.(row.playerId)}
            className="flex w-full items-center gap-2 border-b border-white/5 px-3 py-2.5 text-left last:border-b-0 hover:bg-white/[0.03]"
          >
            <span
              className={`${nameOxanium.className} w-8 text-[13px] font-extrabold tabular-nums text-white/50`}
            >
              {i + 1}
            </span>
            <span
              className={`${nameOxanium.className} min-w-0 flex-1 truncate text-[13px] font-bold`}
              style={{ transform: "skewX(-6deg)" }}
            >
              {row.playerName}
            </span>
            <span
              className={`${nameOxanium.className} w-12 text-right text-[11px] font-bold text-white/55`}
            >
              {TEAM_SHORT[row.teamId] ?? row.teamId}
            </span>
            <span
              className={`${nameOxanium.className} w-14 text-right text-[14px] font-extrabold tabular-nums`}
              style={{ transform: "skewX(-8deg)" }}
            >
              {formatPlayerLeaderValue(metric, row.value)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
