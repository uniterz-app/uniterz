import { teamColorsB1 } from "../../../../../lib/teams-b1";
import { teamColorsJ1 } from "../../../../../lib/teams-j1";
import { teamColorsNBA } from "../../../../../lib/teams-nba";
import { teamColorsPL } from "../../../../../lib/teams-pl";
import type { SupportedLeague } from "./useTodayGames";

type SideLike = {
  teamId?: unknown;
  colorHex?: unknown;
} | null | undefined;

const jerseyPrimaryOverridesNBA: Record<string, string> = {
  "nba-hawks": "#E31837",
  "nba-celtics": "#007A33",
  "nba-nets": "#000000",
  "nba-hornets": "#00788C",
  "nba-bulls": "#000000",
  "nba-cavaliers": "#860038",
  "nba-pistons": "#C8102E",
  "nba-pacers": "#003DA5",
  "nba-heat": "#C8102E",
  "nba-bucks": "#00471B",
  "nba-knicks": "#F58426",
  "nba-magic": "#000000",
  "nba-76ers": "#0B6BD8",
  "nba-raptors": "#E31837",
  "nba-wizards": "#002B5C",
  "nba-mavericks": "#0084F0",
  "nba-nuggets": "#FEC525",
  "nba-warriors": "#FDB927",
  "nba-rockets": "#F21C3A",
  "nba-clippers": "#1D428A",
  "nba-lakers": "#FDB927",
  "nba-grizzlies": "#7190C4",
  "nba-timberwolves": "#0C2340",
  "nba-pelicans": "#C8102E",
  "nba-thunder": "#F05333",
  "nba-suns": "#1D1160",
  "nba-blazers": "#E31837",
  "nba-kings": "#5A2D81",
  "nba-spurs": "#C4CED4",
  "nba-jazz": "#0077C0",
};

const jerseySecondaryOverridesNBA: Record<string, string> = {
  "nba-hawks": "#FDBB30",
  "nba-celtics": "#FFFFFF",
  "nba-nets": "#FFFFFF",
  "nba-hornets": "#1D1160",
  "nba-bulls": "#E31837",
  "nba-cavaliers": "#FDBB30",
  "nba-pistons": "#1D42BA",
  "nba-pacers": "#FDBB30",
  "nba-heat": "#FFFFFF",
  "nba-bucks": "#EEE1C6",
  "nba-knicks": "#006BB6",
  "nba-magic": "#0077C0",
  "nba-76ers": "#FFFFFF",
  "nba-raptors": "#000000",
  "nba-wizards": "#E31837",
  "nba-mavericks": "#B8C4CA",
  "nba-nuggets": "#0D2440",
  "nba-warriors": "#FFFFFF",
  "nba-rockets": "#000000",
  "nba-clippers": "#C8102E",
  "nba-lakers": "#000000",
  "nba-grizzlies": "#12173F",
  "nba-timberwolves": "#78BE20",
  "nba-pelicans": "#C5A017",
  "nba-thunder": "#0A7EC2",
  "nba-suns": "#E56020",
  "nba-blazers": "#000000",
  "nba-kings": "#C4CED4",
  "nba-spurs": "#000000",
  "nba-jazz": "#FFFFFF",
};

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
  return null;
}

function getSecondaryByLeague(league: SupportedLeague, teamId: string): string | null {
  if (league === "nba") return teamColorsNBA[teamId]?.secondary ?? null;
  if (league === "bj") return teamColorsB1[teamId]?.secondary ?? null;
  if (league === "j1") return teamColorsJ1[teamId]?.secondary ?? null;
  if (league === "pl") return teamColorsPL[teamId]?.secondary ?? null;
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
    if (league === "nba" && jerseySecondaryOverridesNBA[teamId]) {
      secondary = jerseySecondaryOverridesNBA[teamId];
    } else {
      secondary = getSecondaryByLeague(league, teamId);
    }
  }
  if (!secondary) secondary = deriveSecondaryFromPrimary(primary);

  return { primary, secondary };
}
