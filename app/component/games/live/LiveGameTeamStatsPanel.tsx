"use client";

import {
  formatLiveTeamStatValue,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStats";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  report: LiveGameStatsReport;
};

const WIN_GREEN = "#5cf0b5";
const FRAME = "rgba(255,255,255,0.22)";
const ROW_LINE = "rgba(255,255,255,0.1)";

/** チームスタッツ比較行のみ（スコアヘッダーは LiveGameStatsPanel 側） */
export default function LiveGameTeamStatsPanel({ report }: Props) {
  return (
    <div
      className="overflow-hidden border px-3 py-1"
      style={{ borderColor: FRAME, backgroundColor: "transparent" }}
    >
      {report.teamStats.map((row, i) => {
        const leftWin = row.lowerIsBetter
          ? row.home < row.away
          : row.home > row.away;
        const rightWin = row.lowerIsBetter
          ? row.away < row.home
          : row.away > row.home;
        const last = i === report.teamStats.length - 1;

        return (
          <div
            key={row.key}
            className="flex items-center py-2"
            style={
              last ? undefined : { borderBottom: `1px solid ${ROW_LINE}` }
            }
          >
            <p
              className={[
                nameOxanium.className,
                "flex-1 text-right text-[15px] font-extrabold tabular-nums",
                leftWin ? "" : "text-white",
              ].join(" ")}
              style={
                leftWin
                  ? {
                      color: WIN_GREEN,
                      textShadow:
                        "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)",
                      transform: "skewX(-6deg)",
                    }
                  : { transform: "skewX(-6deg)" }
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
                nameOxanium.className,
                "flex-1 text-left text-[15px] font-extrabold tabular-nums",
                rightWin ? "" : "text-white",
              ].join(" ")}
              style={
                rightWin
                  ? {
                      color: WIN_GREEN,
                      textShadow:
                        "0 0 6px rgba(92,240,181,0.42), 0 0 2px rgba(92,240,181,0.55)",
                      transform: "skewX(-6deg)",
                    }
                  : { transform: "skewX(-6deg)" }
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
