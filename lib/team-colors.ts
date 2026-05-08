import type { League } from "@/lib/leagues";
import { teamColorsB1 } from "./teams-b1";
import { teamColorsJ1 } from "./teams-j1";
import { teamColorsNBA } from "./teams-nba";
import { teamColorsPL } from "./teams-pl";
import { teamColorsWC } from "./teams-wc";

/** ユニフォーム専用の色上書き（まずはポストシーズン対象から段階的に調整） */
const jerseyPrimaryOverridesNBA: Record<string, string> = {
  "nba-76ers": "#003DA5",
  "nba-magic": "#0075BD",
  "nba-nuggets": "#FEC525",
  "nba-pistons": "#ED174C",
  "nba-hornets": "#1D8CAB",
  "nba-knicks": "#F48328",
  "nba-lakers": "#DFFE00",
  "nba-suns": "#E66226",
  "nba-timberwolves": "#0C2340",
  "nba-warriors": "#DFFE00",
  "nba-blazers": "#E13A3E",
  "nba-cavaliers": "#6F212F",
  "nba-celtics": "#BC9A5C",
  "nba-hawks": "#CC092F",
  "nba-raptors": "#BE0F34",
  "nba-rockets": "#D31145",
  "nba-spurs": "#C4CED4",
  "nba-thunder": "#F05133",
};

/** ユニフォームのグラデ終点を primary と同じにするチーム（単色に近い見た目） */
const jerseyGradientEndMatchesPrimaryNBA = new Set<string>([
  "nba-76ers",
  "nba-blazers",
  "nba-cavaliers",
  "nba-celtics",
  "nba-hawks",
  "nba-hornets",
  "nba-knicks",
  "nba-lakers",
  "nba-magic",
  "nba-nuggets",
  "nba-pistons",
  "nba-raptors",
  "nba-rockets",
  "nba-spurs",
  "nba-suns",
  "nba-thunder",
  "nba-timberwolves",
  "nba-warriors",
]);

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

    case "wc":
      return teamColorsWC[teamId]?.primary ?? "#ffffff";

    default:
      return "#ffffff";
  }
}

/** ユニフォーム用 primary（未指定チームは通常のチームカラーを使う） */
export function getTeamJerseyPrimaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (!teamId) return getTeamPrimaryColor(league, teamId);
  if (league === "nba") {
    return jerseyPrimaryOverridesNBA[teamId] ?? getTeamPrimaryColor(league, teamId);
  }
  return getTeamPrimaryColor(league, teamId);
}

/** ユニフォーム canvas の2色目（通常はチーム secondary、上記セットのチームは jersey primary と同色） */
export function getTeamJerseySecondaryColor(
  league: League,
  teamId: string | null | undefined
): string {
  if (
    league === "nba" &&
    teamId &&
    jerseyGradientEndMatchesPrimaryNBA.has(teamId)
  ) {
    return getTeamJerseyPrimaryColor(league, teamId);
  }
  return getTeamSecondaryColor(league, teamId);
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

    case "wc":
      return teamColorsWC[teamId]?.secondary ?? deriveSecondaryFromPrimary(primary);

    default:
      return deriveSecondaryFromPrimary(primary);
  }
}
