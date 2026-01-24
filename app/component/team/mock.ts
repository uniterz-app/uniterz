export const TEAM_COLORS = {
  primary: "#007AC1",
  secondary: "#FDBB30",
  orange: "#EF3B24",
};

export type TeamDetail = {
  id: string;
  name: string;
  conference: string;
  rank: number;
  wins: number;
  losses: number;
  ppgRank: number;
  winRate: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  clutch: { wins: number; losses: number };
  conferenceRecord: {
    vsEast: { wins: number; losses: number };
    vsWest: { wins: number; losses: number };
  };
  last10: {
    wins: number;
    losses: number;
    games: {
      date: string;
      vs: string;
      home: boolean;
      score: string;
      result: "W" | "L";
    }[];
  };
  colors: typeof TEAM_COLORS;
};

export const MOCK_TEAM: TeamDetail = {
  id: "nba-thunder",
  name: "Oklahoma City Thunder",
  conference: "WEST",
  rank: 1,
  wins: 30,
  losses: 8,
  ppgRank: 3,
  winRate: 78.9,
  avgPointsFor: 118.2,
  avgPointsAgainst: 110.1,
  clutch: { wins: 8, losses: 4 },
  conferenceRecord: {
    vsEast: { wins: 18, losses: 6 },
    vsWest: { wins: 12, losses: 2 },
  },
  last10: {
    wins: 7,
    losses: 3,
    games: [
      { date: "01/10", home: true,  vs: "DEN", score: "112-105", result: "W" },
      { date: "01/08", home: false, vs: "LAL", score: "98-110",  result: "L" },
      { date: "01/06", home: true,  vs: "PHX", score: "120-113", result: "W" },
      { date: "01/04", home: false, vs: "GSW", score: "104-111", result: "L" },
      { date: "01/02", home: true,  vs: "DAL", score: "118-109", result: "W" },
      { date: "12/30", home: false, vs: "SAC", score: "122-114", result: "W" },
      { date: "12/28", home: true,  vs: "MEM", score: "110-101", result: "W" },
      { date: "12/26", home: false, vs: "NOP", score: "107-115", result: "L" },
      { date: "12/24", home: true,  vs: "UTA", score: "125-108", result: "W" },
      { date: "12/22", home: false, vs: "HOU", score: "116-104", result: "W" },
    ],
  },
  colors: TEAM_COLORS,
};