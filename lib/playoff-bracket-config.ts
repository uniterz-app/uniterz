// lib/playoff-bracket-config.ts

export type PlayoffSeedTeam = {
  code: string;
  seed: number;
};

export type PlayoffBracketConfig = {
  season: string;
  east: PlayoffSeedTeam[];
  west: PlayoffSeedTeam[];
  /** シード未確定期間など、提出を一時的に止める */
  allowSubmission?: boolean;
};

/* =========================
   Season Configs
========================= */

export const PLAYOFF_BRACKET_CONFIGS: Record<string, PlayoffBracketConfig> = {
  "2026": {
    season: "2026",
    allowSubmission: false,
    east: [
      { code: "DET", seed: 1 },
      { code: "BOS", seed: 2 },
      { code: "NYK", seed: 3 },
      { code: "CLE", seed: 4 },
      { code: "TOR", seed: 5 },
      { code: "ATL", seed: 6 },
      { code: "PHI", seed: 7 },
      { code: "CHA", seed: 8 },
    ],
    west: [
      { code: "OKC", seed: 1 },
      { code: "SAS", seed: 2 },
      { code: "DEN", seed: 3 },
      { code: "LAL", seed: 4 },
      { code: "HOU", seed: 5 },
      { code: "MIN", seed: 6 },
      { code: "POR", seed: 7 },
      { code: "GSW", seed: 8 },
    ],
  },
};

/* =========================
   Helpers
========================= */

export function getCurrentPlayoffSeason(): string {
  const currentYear = String(new Date().getFullYear());

  if (PLAYOFF_BRACKET_CONFIGS[currentYear]) {
    return currentYear;
  }

  const seasons = Object.keys(PLAYOFF_BRACKET_CONFIGS).sort(
    (a, b) => Number(b) - Number(a)
  );

  return seasons[0] ?? "2026";
}

export function getPlayoffBracketConfig(
  season: string
): PlayoffBracketConfig {
  const config = PLAYOFF_BRACKET_CONFIGS[season];
  if (!config) {
    throw new Error(`Playoff config not found for season: ${season}`);
  }
  return config;
}

/* =========================
   Round1 Builder
========================= */

export function buildRound1Series(config: PlayoffBracketConfig) {
  const east = [...config.east].sort((a, b) => a.seed - b.seed);
  const west = [...config.west].sort((a, b) => a.seed - b.seed);

  const eastR1: [PlayoffSeedTeam, PlayoffSeedTeam][] = [
    [east[0], east[7]],
    [east[3], east[4]],
    [east[1], east[6]],
    [east[2], east[5]],
  ];

  const westR1: [PlayoffSeedTeam, PlayoffSeedTeam][] = [
    [west[0], west[7]],
    [west[3], west[4]],
    [west[1], west[6]],
    [west[2], west[5]],
  ];

  return {
    eastR1,
    westR1,
  };
}