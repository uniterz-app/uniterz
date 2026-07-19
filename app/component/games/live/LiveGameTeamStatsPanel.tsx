"use client";

import {
  formatLiveTeamStatValue,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStats";
import { nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";

type Props = {
  report: LiveGameStatsReport;
};

const WIN_GREEN = "#5cf0b5";

/** チームスタッツ比較行のみ（スコアヘッダーは LiveGameStatsPanel 側） */
export default function LiveGameTeamStatsPanel({ report }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1">
      {report.teamStats.map((row) => {
        const leftWin = row.lowerIsBetter
          ? row.home < row.away
          : row.home > row.away;
        const rightWin = row.lowerIsBetter
          ? row.away < row.home
          : row.away > row.home;

        return (
          <div
            key={row.key}
            className="flex items-center border-b border-white/8 py-2 last:border-b-0"
          >
            <p
              className={[
                resultStatsMetricNumClass,
                "flex-1 text-right text-[15px] tabular-nums",
                leftWin ? "" : "text-white",
              ].join(" ")}
              style={
                leftWin
                  ? {
                      color: WIN_GREEN,
                      textShadow:
                        "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)",
                    }
                  : undefined
              }
            >
              {formatLiveTeamStatValue(row.home, row.format)}
            </p>
            <p
              className={[
                nameOxanium.className,
                "w-20 shrink-0 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white/45",
              ].join(" ")}
            >
              {row.label}
            </p>
            <p
              className={[
                resultStatsMetricNumClass,
                "flex-1 text-left text-[15px] tabular-nums",
                rightWin ? "" : "text-white",
              ].join(" ")}
              style={
                rightWin
                  ? {
                      color: WIN_GREEN,
                      textShadow:
                        "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)",
                    }
                  : undefined
              }
            >
              {formatLiveTeamStatValue(row.away, row.format)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
