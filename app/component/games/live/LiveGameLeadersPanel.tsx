"use client";

import {
  deriveLiveGameLeaders,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStats";
import { playerCardName } from "@/lib/predict/nbaRoster";
import { nameOxanium } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";

type Props = {
  report: LiveGameStatsReport;
};

const FRAME = "rgba(255,255,255,0.22)";
const ROW_LINE = "rgba(255,255,255,0.1)";

/** 試合スタッツリーダー（縦リスト） */
export default function LiveGameLeadersPanel({ report }: Props) {
  const leaders = deriveLiveGameLeaders(report);
  if (leaders.length === 0) return null;

  return (
    <div
      className="overflow-hidden border"
      style={{ borderColor: FRAME, backgroundColor: "transparent" }}
    >
      {leaders.map((L, i) => {
        const accent =
          getTeamPrimaryColor("nba", L.teamId) ?? "#e8edf5";
        const last = i === leaders.length - 1;
        return (
          <div
            key={L.key}
            className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto_2.75rem] items-center gap-2 px-3 py-2.5"
            style={
              last ? undefined : { borderBottom: `1px solid ${ROW_LINE}` }
            }
          >
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.14em] text-white/40",
              ].join(" ")}
            >
              {L.label}
            </p>
            <p
              className={[
                nameOxanium.className,
                "min-w-0 truncate text-[13px] font-bold uppercase tracking-[0.04em] text-white",
              ].join(" ")}
              style={{ transform: "skewX(-6deg)" }}
            >
              {playerCardName(L)}
            </p>
            <p
              className={[
                nameOxanium.className,
                "text-[11px] font-extrabold uppercase tracking-[0.08em]",
              ].join(" ")}
              style={{ color: accent }}
            >
              {L.teamAbbr}
            </p>
            <p
              className={[
                nameOxanium.className,
                "text-right text-[16px] font-extrabold tabular-nums text-white",
              ].join(" ")}
              style={{ transform: "skewX(-6deg)" }}
            >
              {L.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
