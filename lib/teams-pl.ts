// teams-pl.ts

export type TeamColor = {
  primary: string;
  secondary?: string;
  textOnPrimary?: string;
};

export type TeamColorMap = Record<string, TeamColor>;

/**
 * Premier League teamId ベース カラーマップ
 */
export const teamColorsPL: TeamColorMap = {
  "pl-arsenal": { primary: "#EF0107", secondary: "#063672" },
  "pl-aston-villa": { primary: "#95BFE5", secondary: "#670E36" },
  "pl-bournemouth": { primary: "#DA291C", secondary: "#000000" },
  "pl-brentford": { primary: "#E30613", secondary: "#000000" },
  "pl-brighton": { primary: "#0057B8", secondary: "#FFFFFF" },
  "pl-chelsea": { primary: "#034694", secondary: "#DBA111" },
  "pl-crystal-palace": { primary: "#1B458F", secondary: "#C4122E" },
  "pl-everton": { primary: "#003399", secondary: "#FFFFFF" },
  "pl-fulham": { primary: "#000000", secondary: "#FFFFFF", textOnPrimary: "#FFF" },
  "pl-ipswich": { primary: "#003A8F", secondary: "#FFFFFF" },
  "pl-leicester": { primary: "#003090", secondary: "#FDBE11" },
  "pl-liverpool": { primary: "#C8102E", secondary: "#00B2A9" },
  "pl-man-city": { primary: "#6CABDD", secondary: "#1C2C5B" },
  "pl-man-united": { primary: "#DA291C", secondary: "#FBE122" },
  "pl-newcastle": { primary: "#000000", secondary: "#FFFFFF", textOnPrimary: "#FFF" },
  "pl-nottingham": { primary: "#DD0000", secondary: "#FFFFFF" },
  "pl-southampton": { primary: "#D71920", secondary: "#FFFFFF" },
  "pl-tottenham": { primary: "#132257", secondary: "#FFFFFF" },
  "pl-west-ham": { primary: "#7A263A", secondary: "#1BB1E7" },
  "pl-wolves": { primary: "#FDB913", secondary: "#231F20", textOnPrimary: "#000" },
  "pl-sunderland": { primary: "#EB172B", secondary: "#FFFFFF" },
  "pl-leeds": { primary: "#FFFFFF", secondary: "#1D428A", textOnPrimary: "#000" },
  "pl-burnley": { primary: "#6C1D45", secondary: "#99D6EA" }
};
