import type { League } from "@/lib/leagues";
import { teamColorsB1 } from "./teams-b1";
import { teamColorsJ1 } from "./teams-j1";
import { teamColorsNBA } from "./teams-nba";
import { teamColorsPL } from "./teams-pl";

/** マップに secondary が無いとき、primary からグラデーション用の2色目を生成する */
function deriveSecondaryFromPrimary(primaryHex: string): string {
  const hex = primaryHex.trim().replace(/^#/, "");
  let r = 128;
  let g = 128;
  let b = 128;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  }
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#3d3d42";
  // 黒寄りにせず primary に白を混ぜた副色（ユニが暗くなり過ぎない）
  const mixWhite = 0.2;
  const rr = Math.min(255, Math.round(r * (1 - mixWhite) + 255 * mixWhite));
  const gg = Math.min(255, Math.round(g * (1 - mixWhite) + 255 * mixWhite));
  const bb = Math.min(255, Math.round(b * (1 - mixWhite) + 255 * mixWhite));
  return `#${[rr, gg, bb]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getTeamPrimaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (!teamId) return "#ffffff";

  switch (league) {
    case "bj":
      return teamColorsB1[teamId]?.primary ?? "#ffffff";

    case "j1":
      return teamColorsJ1[teamId]?.primary ?? "#ffffff";

    case "nba":
      return teamColorsNBA[teamId]?.primary ?? "#ffffff";

    case "pl":
      return teamColorsPL[teamId]?.primary ?? "#ffffff";

    default:
      return "#ffffff";
  }
}

export function getTeamSecondaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  const primary = getTeamPrimaryColor(league, teamId);
  if (!teamId) return deriveSecondaryFromPrimary(primary);

  switch (league) {
    case "bj":
      return teamColorsB1[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "j1":
      return teamColorsJ1[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "nba":
      return teamColorsNBA[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    case "pl":
      return teamColorsPL[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    default:
      return deriveSecondaryFromPrimary(primary);
  }
}
