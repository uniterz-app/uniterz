export type TeamColor = { primary: string; secondary?: string; textOnPrimary?: string };
export type TeamColorMap = Record<string, TeamColor>;

export const teamColorsNBA: TeamColorMap = {
  /* EAST */

  // ATL Hawks
  "nba-hawks":        { primary: "#E03A3E", secondary: "#C1D32F" },

  // BOS Celtics
  "nba-celtics":      { primary: "#007A33", secondary: "#BA9653" },

  // BKN Nets
  "nba-nets":         { primary: "#000000", secondary: "#FFFFFF", textOnPrimary: "#fff" },

  // CHA Hornets
  "nba-hornets":      { primary: "#1D1160", secondary: "#00788C" },

  // CHI Bulls
  "nba-bulls":        { primary: "#CE1141", secondary: "#000000" },

  // CLE Cavaliers
  "nba-cavaliers":    { primary: "#6F263D", secondary: "#FFB81C" },

  // DET Pistons → Red 主導
  "nba-pistons":      { primary: "#C8102E", secondary: "#006BB6" },

  // IND Pacers → Gold 主導
  "nba-pacers":       { primary: "#FDBB30", secondary: "#002D62" },

  // MIA Heat
  "nba-heat":         { primary: "#98002E", secondary: "#F9A01B" },

  // MIL Bucks
  "nba-bucks":        { primary: "#00471B", secondary: "#EEE1C6" },

  // NYK Knicks → Orange 主導
  "nba-knicks":       { primary: "#F58426", secondary: "#006BB6" },

  // ORL Magic → Black 主導
  "nba-magic":        { primary: "#000000", secondary: "#0077C0", textOnPrimary: "#fff" },

  // PHI 76ers
  "nba-76ers":        { primary: "#006BB6", secondary: "#ED174C" },

  // TOR Raptors
  "nba-raptors":      { primary: "#CE1141", secondary: "#000000" },

  // WAS Wizards → Red 主導
  "nba-wizards":      { primary: "#E31837", secondary: "#002B5C" },

  
  /* WEST */

  // DAL Mavericks → Navy 主導
  "nba-mavericks":    { primary: "#002B5C", secondary: "#00538C" },

  // DEN Nuggets → Gold 主導
  "nba-nuggets":      { primary: "#FEC524", secondary: "#0E2240" },

  // GSW Warriors → Yellow 主導
  "nba-warriors":     { primary: "#FFC72C", secondary: "#1D428A" },

  // HOU Rockets
  "nba-rockets":      { primary: "#CE1141", secondary: "#000000" },

  // LAC Clippers
  "nba-clippers":     { primary: "#C8102E", secondary: "#1D428A" },

  // LAL Lakers → Yellow 主導（あなた希望）
  "nba-lakers":       { primary: "#FDB927", secondary: "#552583" },

  // MEM Grizzlies
  "nba-grizzlies":    { primary: "#5D76A9", secondary: "#12173F" },

  // MIN Timberwolves
  "nba-timberwolves": { primary: "#0C2340", secondary: "#236192" },

  // NOP Pelicans
  "nba-pelicans":     { primary: "#0C2340", secondary: "#C8102E" },

  // OKC Thunder → Orange 主導
  "nba-thunder":      { primary: "#EF3B24", secondary: "#007AC1" },

  // PHX Suns
  "nba-suns":         { primary: "#1D1160", secondary: "#E56020" },

  // POR Trail Blazers
  "nba-blazers":      { primary: "#E03A3E", secondary: "#000000" },

  // SAC Kings
  "nba-kings":        { primary: "#5A2D81", secondary: "#63727A" },

  // SAS Spurs
  "nba-spurs":        { primary: "#C4CED4", secondary: "#000000", textOnPrimary: "#000" },

  // UTA Jazz
  "nba-jazz":         { primary: "#002B5C", secondary: "#00471B" },
};
