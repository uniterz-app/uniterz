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
  className?: string;
};

export default function TeamAbbrBadge({ abbr, teamId, className = "" }: Props) {
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
  const fill = id
    ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", id))
    : "#5B8CFF";
  const ink = contrastingInkOnHex(fill);

  return (
    <span
      className={[
        nameOxanium.className,
        "relative grid h-[22px] min-w-[2.35rem] shrink-0 place-items-center overflow-hidden px-2 text-[9px] font-black uppercase tracking-[0.08em]",
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
      <span style={{ transform: "skewX(14deg)" }}>{resolvedAbbr}</span>
    </span>
  );
}
