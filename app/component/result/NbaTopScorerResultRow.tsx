"use client";

import { Check, X } from "lucide-react";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { nameOxanium } from "@/lib/fonts";
import type { NbaTopScorerResultInfo } from "@/lib/result/resolveNbaTopScorerResult";

type Props = {
  label: string;
  info: NbaTopScorerResultInfo;
  compact?: boolean;
  className?: string;
};

/** リザルト: 最多得点者予想行（選手名・チームタグ・的中マーク） */
export default function NbaTopScorerResultRow({
  label,
  info,
  compact = false,
  className = "",
}: Props) {
  const teamColor = getTeamPrimaryColor("nba", info.teamId) ?? "#e8edf5";

  return (
    <div
      className={[
        "flex items-center gap-2",
        compact ? "py-1" : "py-1.5",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 font-semibold text-white",
          compact ? "w-[5.5rem] text-[12px] leading-snug" : "w-32 text-[13px]",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={[
            "min-w-0 truncate font-medium text-white/90",
            compact ? "text-[12px]" : "text-[13px]",
          ].join(" ")}
        >
          {info.playerName}
        </span>
        <span
          className={[
            nameOxanium.className,
            "shrink-0 rounded-[2px] border bg-transparent px-1.5 py-0.5 font-extrabold uppercase tracking-[0.12em]",
            compact ? "text-[7px]" : "text-[8px]",
          ].join(" ")}
          style={{ borderColor: teamColor, color: teamColor }}
        >
          {info.teamTag}
        </span>
      </span>
      <span className="shrink-0" aria-hidden={info.hit == null}>
        {info.hit === true ? (
          <Check
            className={compact ? "h-4 w-4 text-emerald-400" : "h-5 w-5 text-emerald-400"}
            strokeWidth={2.5}
          />
        ) : info.hit === false ? (
          <X
            className={compact ? "h-4 w-4 text-rose-400" : "h-5 w-5 text-rose-400"}
            strokeWidth={2.5}
          />
        ) : (
          <span className="inline-block w-5" />
        )}
      </span>
    </div>
  );
}
