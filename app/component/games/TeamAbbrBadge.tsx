"use client";

/** Native `TeamAbbrBadgeNative` / Awards パネル相当 */
import { nameOxanium } from "@/lib/fonts";
import { nbaTeamIdFromBracketCode } from "@/lib/nba-bracket-code";
import {
  contrastingInkOnHex,
  getTeamJerseyPrimaryColor,
  softenTeamUiColor,
} from "@/lib/team-colors";
import { TEAM_SHORT } from "@/lib/team-short";

type Props = {
  abbr?: string | null;
  teamId?: string | null;
  /** 同系色対決時など、塗りを上書き（未指定ならチーム primary） */
  fillColor?: string | null;
  /** `sm` = アワード市場など密な行向け */
  size?: "md" | "sm";
  className?: string;
};

export default function TeamAbbrBadge({
  abbr,
  teamId,
  fillColor,
  size = "md",
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
  const ink = contrastingInkOnHex(fill);
  const sm = size === "sm";

  return (
    <span
      className={[
        nameOxanium.className,
        "relative grid shrink-0 place-items-center overflow-hidden font-black uppercase",
        sm
          ? "h-[16px] min-w-[1.7rem] px-1 text-[7px] tracking-[0.06em]"
          : "h-[22px] min-w-[2.35rem] px-2 text-[9px] tracking-[0.08em]",
        className,
      ].join(" ")}
      style={{
        backgroundColor: fill,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
        color: ink,
        transform: "skewX(-14deg)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
      }}
      aria-hidden
    >
      {/* 枠 -14deg + 文字 +8deg → 画面上は選手名と同じ -6deg */}
      <span style={{ transform: "skewX(8deg)" }}>{resolvedAbbr}</span>
    </span>
  );
}
