// lib/playoff-bracket-config.ts

export type PlayoffSeedTeam = {
  code: string;
  seed: number;
};

export type PlayoffBracketConfig = {
  season: string;
  east: PlayoffSeedTeam[];
  west: PlayoffSeedTeam[];
};

/* =========================
   Season Configs
========================= */

export const PLAYOFF_BRACKET_CONFIGS: Record<string, PlayoffBracketConfig> = {
  "2026": {
    season: "2026",
    east: [
      { code: "BOS", seed: 1 },
      { code: "MIL", seed: 2 },
      { code: "NYK", seed: 3 },
      { code: "CLE", seed: 4 },
      { code: "ORL", seed: 5 },
      { code: "PHI", seed: 6 },
      { code: "IND", seed: 7 },
      { code: "MIA", seed: 8 },
    ],
    west: [
      { code: "OKC", seed: 1 },
      { code: "DEN", seed: 2 },
      { code: "MIN", seed: 3 },
      { code: "LAC", seed: 4 },
      { code: "DAL", seed: 5 },
      { code: "PHX", seed: 6 },
      { code: "LAL", seed: 7 },
      { code: "NOP", seed: 8 },
    ],
  },
};

/* =========================
   Helpers
========================= */

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
    [east[1], east[6]],
    [east[2], east[5]],
    [east[3], east[4]],
  ];

  const westR1: [PlayoffSeedTeam, PlayoffSeedTeam][] = [
    [west[0], west[7]],
    [west[1], west[6]],
    [west[2], west[5]],
    [west[3], west[4]],
  ];

  return {
    eastR1,
    westR1,
  };
}