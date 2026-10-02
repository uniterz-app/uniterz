"use client";

/** Native `TeamAbbrBadgeNative` / Awards パネル相当 — OUTLINE GLOW */
import { nameOxanium } from "@/lib/fonts";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import {
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";

type Props = {
  abbr?: string | null;
  teamId?: string | null;
  /** 同系色対決時など、塗りを上書き（未指定ならチーム primary） */
  fillColor?: string | null;
  /** @deprecated サイズは統一。無視される */
  size?: "md" | "sm";
  className?: string;
};

export default function TeamAbbrBadge({
  abbr,
  teamId,
  fillColor,
  className = "",
}: Props) {
  const resolvedAbbr = (
    abbr?.trim() ||
    (teamId ? TEAM_SHORT[teamId] : null) ||
    ""
  )
    .slice(0, 3)
    .toUpperCase();
  if (!resolvedAbbr) return null;

  const id =
    teamId?.startsWith("nba-")
      ? teamId
      : nbaTeamIdFromBracketCode(resolvedAbbr);
  const fill = fillColor
    ? softenTeamUiColor(fillColor)
    : id
      ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", id))
      : "#5B8CFF";

  return (
    <span
      className={[
        nameOxanium.className,
        "relative grid h-[22px] w-[2.5rem] shrink-0 place-items-center overflow-hidden border-[1.5px] bg-transparent text-[9px] font-black uppercase tracking-[0.08em]",
        className,
      ].join(" ")}
      style={{
        borderColor: fill,
        color: fill,
        transform: "skewX(-14deg)",
        boxShadow: `0 0 8px ${fill}99, 0 0 2px ${fill}cc`,
        backgroundImage: `repeating-linear-gradient(
          0deg,
          ${fill}33 0px,
          ${fill}33 1px,
          transparent 1px,
          transparent 3px
        )`,
      }}
      aria-hidden
    >
      {/* 枠 -14deg + 文字 +8deg → 画面上は選手名と同じ -6deg */}
      <span style={{ transform: "skewX(8deg)" }}>{resolvedAbbr}</span>
    </span>
  );
}
