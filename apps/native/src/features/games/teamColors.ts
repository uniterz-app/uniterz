import { teamColorsB1 } from "../../../../../lib/teams-b1";
import { teamColorsJ1 } from "../../../../../lib/teams-j1";
import { teamColorsNBA } from "../../../../../lib/teams-nba";
import { teamColorsPL } from "../../../../../lib/teams-pl";
import { teamColorsWC } from "../../../../../lib/teams-wc";
import type { SupportedLeague } from "./useTodayGames";

type SideLike = {
  teamId?: unknown;
  colorHex?: unknown;
} | null | undefined;

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

function normalizeLeague(raw: unknown): SupportedLeague {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "nba") return "nba";
  if (v === "bj" || v === "b1" || v.includes("b.league")) return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "pl" || v.includes("premier") || v.includes("epl")) return "pl";
  if (v === "wc") return "wc";
  return "nba";
}

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
  const mixWhite = 0.2;
  const rr = Math.min(255, Math.round(r * (1 - mixWhite) + 255 * mixWhite));
  const gg = Math.min(255, Math.round(g * (1 - mixWhite) + 255 * mixWhite));
  const bb = Math.min(255, Math.round(b * (1 - mixWhite) + 255 * mixWhite));
  return `#${[rr, gg, bb].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function getPrimaryByLeague(league: SupportedLeague, teamId: string): string | null {
  if (league === "nba") return teamColorsNBA[teamId]?.primary ?? null;
  if (league === "bj") return teamColorsB1[teamId]?.primary ?? null;
  if (league === "j1") return teamColorsJ1[teamId]?.primary ?? null;
  if (league === "pl") return teamColorsPL[teamId]?.primary ?? null;
  if (league === "wc") return teamColorsWC[teamId]?.primary ?? null;
  return null;
}

function getSecondaryByLeague(league: SupportedLeague, teamId: string): string | null {
  if (league === "nba") return teamColorsNBA[teamId]?.secondary ?? null;
  if (league === "bj") return teamColorsB1[teamId]?.secondary ?? null;
  if (league === "j1") return teamColorsJ1[teamId]?.secondary ?? null;
  if (league === "pl") return teamColorsPL[teamId]?.secondary ?? null;
  if (league === "wc") return teamColorsWC[teamId]?.secondary ?? null;
  return null;
}

function parseSide(side: unknown): { teamId: string | null; colorHex: string | null } {
  const src = side as SideLike;
  const teamIdRaw = src?.teamId;
  const colorHexRaw = src?.colorHex;
  const teamId = typeof teamIdRaw === "string" && teamIdRaw.trim() ? teamIdRaw : null;
  const colorHex = typeof colorHexRaw === "string" && colorHexRaw.trim() ? colorHexRaw : null;
  return { teamId, colorHex };
}

export function resolveTeamPrimaryColor(
  leagueRaw: unknown,
  side: unknown,
  fallback: string
): string {
  const league = normalizeLeague(leagueRaw);
  const { teamId, colorHex } = parseSide(side);
  if (teamId) {
    const mapped = getPrimaryByLeague(league, teamId);
    if (mapped) return mapped;
  }
  if (colorHex) return colorHex;
  return fallback;
}

export function resolveTeamJerseyPalette(
  leagueRaw: unknown,
  side: unknown,
  fallbackPrimary: string
): { primary: string; secondary: string } {
  const league = normalizeLeague(leagueRaw);
  const { teamId, colorHex } = parseSide(side);

  let primary = fallbackPrimary;
  if (teamId) {
    const mappedPrimary = getPrimaryByLeague(league, teamId);
    if (mappedPrimary) primary = mappedPrimary;
    if (league === "nba" && jerseyPrimaryOverridesNBA[teamId]) {
      primary = jerseyPrimaryOverridesNBA[teamId];
    }
  } else if (colorHex) {
    primary = colorHex;
  }

  let secondary: string | null = null;
  if (teamId) {
    if (league === "nba" && jerseyGradientEndMatchesPrimaryNBA.has(teamId)) {
      secondary = primary;
    } else {
      secondary = getSecondaryByLeague(league, teamId);
    }
  }
  if (!secondary) secondary = deriveSecondaryFromPrimary(primary);

  return { primary, secondary };
}
