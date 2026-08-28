export type TeamColor = { primary: string; secondary?: string; textOnPrimary?: string };
export type TeamColorMap = Record<string, TeamColor>;

export const teamColorsNBA: TeamColorMap = {
  /* EAST */

  // ATL Hawks → 画面用の明るい赤 + Yellow
  "nba-hawks":        { primary: "#E31837", secondary: "#FDBB30" },

  // BOS Celtics → Green + White（ライン）
  "nba-celtics":      { primary: "#007A33", secondary: "#FFFFFF" },

  // BKN Nets
  "nba-nets":         { primary: "#000000", secondary: "#FFFFFF", textOnPrimary: "#fff" },

  // CHA Hornets → Teal 地 + Purple 枠
  "nba-hornets":      { primary: "#00788C", secondary: "#1D1160" },

  // CHI Bulls → Red 地 + Black 枠
  "nba-bulls":        { primary: "#E31837", secondary: "#000000" },

  // CLE Cavaliers
  "nba-cavaliers":    { primary: "#6F263D", secondary: "#FFB81C" },

  // DET Pistons → Red + Blue
  "nba-pistons":      { primary: "#C8102E", secondary: "#1D42BA" },

  // IND Pacers → Navy 地 + Gold 枠
  "nba-pacers":       { primary: "#003DA5", secondary: "#FDBB30" },

  // MIA Heat → Red 地（Pelicans と同系）+ White ライン
  "nba-heat":         { primary: "#C8102E", secondary: "#FFFFFF" },

  // MIL Bucks
  "nba-bucks":        { primary: "#00471B", secondary: "#EEE1C6" },

  // NYK Knicks → Orange 地 + Blue ライン
  "nba-knicks":       { primary: "#F58426", secondary: "#006BB6" },

  // ORL Magic → Black 地 + Blue ライン
  "nba-magic":        { primary: "#000000", secondary: "#0077C0", textOnPrimary: "#fff" },

  // PHI 76ers → はっきりした Blue 地 + White ライン（紫寄りを避ける）
  "nba-76ers":        { primary: "#0B6BD8", secondary: "#FFFFFF" },

  // TOR Raptors
  "nba-raptors":      { primary: "#E31837", secondary: "#000000" },

  // WAS Wizards → Navy 地 + Red ライン
  "nba-wizards":      { primary: "#002B5C", secondary: "#E31837" },

  
  /* WEST */

  // DAL Mavericks → はっきりしたブルー + Silver 枠
  "nba-mavericks":    { primary: "#0084F0", secondary: "#B8C4CA" },

  // DEN Nuggets → Sunshine Yellow 地 + Navy 枠
  "nba-nuggets":      { primary: "#FEC525", secondary: "#0D2440" },

  // GSW Warriors → Gold 地 + Blue ライン
  "nba-warriors":     { primary: "#FDB927", secondary: "#006BB6" },

  // HOU Rockets → Red 地 + Black ライン
  "nba-rockets":      { primary: "#F21C3A", secondary: "#000000" },

  // LAC Clippers → Blue 地 + Red 枠（Pistons は赤地＋青枠）
  "nba-clippers":     { primary: "#1D428A", secondary: "#C8102E" },

  // LAL Lakers → Gold 地 + Black ライン
  "nba-lakers":       { primary: "#FDB927", secondary: "#000000", textOnPrimary: "#000" },

  // MEM Grizzlies → Beale Blue 地 + Navy 枠（金枠だと Heat と並ぶと紛らわしい）
  "nba-grizzlies":    { primary: "#7190C4", secondary: "#12173F" },

  // MIN Timberwolves → Navy + Lime
  "nba-timberwolves": {
    primary: "#0C2340",
    secondary: "#78BE20",
    textOnPrimary: "#fff",
  },

  // NOP Pelicans → Red 地 + Gold ライン
  "nba-pelicans":     { primary: "#C8102E", secondary: "#C5A017" },

  // OKC Thunder → Orange 地 + Blue ライン
  "nba-thunder":      { primary: "#F05333", secondary: "#0A7EC2" },

  // PHX Suns
  "nba-suns":         { primary: "#1D1160", secondary: "#E56020" },

  // POR Trail Blazers
  "nba-blazers":      { primary: "#E31837", secondary: "#000000" },

  // SAC Kings → Purple + Silver
  "nba-kings":        { primary: "#5A2D81", secondary: "#C4CED4" },

  // SAS Spurs
  "nba-spurs":        { primary: "#C4CED4", secondary: "#000000", textOnPrimary: "#000" },

  // UTA Jazz → Blue 地 + White ライン
  "nba-jazz":         { primary: "#0077C0", secondary: "#FFFFFF" },
};
