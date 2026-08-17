/**
 * /dev/predict-timing-preview — Injury Report mock
 * 先頭プリセットは参考UIどおりの4カード。後で BallDontLie sync に差し替え。
 */

import type { NbaInjuryReport } from "@/lib/predict/nbaInjuryReport";

export const NBA_INJURY_REPORT_BY_PRESET: Record<string, NbaInjuryReport> = {
  "both-teams-rich": {
    asOfLabel: "Game day",
    home: {
      teamId: "nba-lakers",
      teamName: "Lakers",
      side: "home",
      entries: [
        {
          player: {
            id: 237,
            firstName: "LeBron",
            lastName: "James",
            position: "F",
            jerseyNumber: "23",
          },
          status: "Out",
          returnDate: "2 Weeks",
          injuryDetail: "Foot / Plantar Fasciitis",
          description:
            "James (foot) is out with plantar fasciitis. Expected return in about two weeks.",
        },
        {
          player: {
            id: 15,
            firstName: "Anthony",
            lastName: "Davis",
            position: "F-C",
            jerseyNumber: "3",
          },
          status: "Probable",
          returnDate: "Next Game",
          injuryDetail: "Foot / Soreness",
          description: "Davis (foot) is probable after a full practice.",
        },
      ],
    },
    away: {
      teamId: "nba-celtics",
      teamName: "Celtics",
      side: "away",
      entries: [
        {
          player: {
            id: 72,
            firstName: "Jrue",
            lastName: "Holiday",
            position: "G",
            jerseyNumber: "4",
          },
          status: "Questionable",
          returnDate: "Day-to-Day",
          injuryDetail: "Ankle / Sprain",
          description: "Holiday (ankle) is questionable and day-to-day.",
        },
        {
          player: {
            id: 70,
            firstName: "Kristaps",
            lastName: "Porzingis",
            position: "F-C",
            jerseyNumber: "8",
          },
          status: "Doubtful",
          returnDate: "Week-to-Week",
          injuryDetail: "Achilles / Recovery",
          description: "Porzingis (Achilles) is doubtful.",
        },
      ],
    },
  },
  "strong-vs-neutral": {
    asOfLabel: "Game day",
    home: {
      teamId: "nba-lakers",
      teamName: "Lakers",
      side: "home",
      entries: [],
    },
    away: {
      teamId: "nba-knicks",
      teamName: "Knicks",
      side: "away",
      entries: [
        {
          player: {
            id: 380,
            firstName: "OG",
            lastName: "Anunoby",
            position: "F",
            jerseyNumber: "8",
          },
          status: "Out",
          returnDate: "3–5 Days",
          injuryDetail: "Elbow / Contusion",
          description: "Anunoby (elbow) is out vs. the Lakers.",
        },
      ],
    },
  },
  "giant-killer-context": {
    asOfLabel: "Game day",
    home: {
      teamId: "nba-pistons",
      teamName: "Pistons",
      side: "home",
      entries: [
        {
          player: {
            id: 666,
            firstName: "Tobias",
            lastName: "Harris",
            position: "F",
            jerseyNumber: "12",
          },
          status: "Questionable",
          returnDate: "Day-to-Day",
          injuryDetail: "Hip / Soreness",
          description: "Harris (hip) is questionable.",
        },
      ],
    },
    away: {
      teamId: "nba-thunder",
      teamName: "Thunder",
      side: "away",
      entries: [
        {
          player: {
            id: 777,
            firstName: "Isaiah",
            lastName: "Hartenstein",
            position: "C",
            jerseyNumber: "55",
          },
          status: "Out",
          returnDate: "Indefinite",
          injuryDetail: "Calf / Soleus",
          description: "Hartenstein (soleus) remains out.",
        },
        {
          player: {
            id: 778,
            firstName: "Chet",
            lastName: "Holmgren",
            position: "C",
            jerseyNumber: "7",
          },
          status: "Probable",
          returnDate: "Next Game",
          injuryDetail: "Ankle / Sprain",
          description: "Holmgren (ankle) is probable.",
        },
      ],
    },
  },
  "underdog-pattern": {
    asOfLabel: "Game day",
    home: {
      teamId: "nba-warriors",
      teamName: "Warriors",
      side: "home",
      entries: [
        {
          player: {
            id: 115,
            firstName: "Stephen",
            lastName: "Curry",
            position: "G",
            jerseyNumber: "30",
          },
          status: "Doubtful",
          returnDate: "Day-to-Day",
          injuryDetail: "Knee / Soreness",
          description: "Curry (knee) is doubtful for Thursday.",
        },
      ],
    },
    away: {
      teamId: "nba-nuggets",
      teamName: "Nuggets",
      side: "away",
      entries: [],
    },
  },
  sparse: {
    asOfLabel: "Game day",
    home: {
      teamId: "nba-spurs",
      teamName: "Spurs",
      side: "home",
      entries: [],
    },
    away: {
      teamId: "nba-magic",
      teamName: "Magic",
      side: "away",
      entries: [],
    },
  },
};

export function injuryReportForPreset(presetId: string): NbaInjuryReport {
  return (
    NBA_INJURY_REPORT_BY_PRESET[presetId] ??
    NBA_INJURY_REPORT_BY_PRESET["both-teams-rich"]!
  );
}

function matchupKey(homeTeamId: string, awayTeamId: string): string {
  return `${homeTeamId.trim()}|${awayTeamId.trim()}`;
}

/** 2026-27 開幕 Celtics @ Pistons（プレビュー用） */
const PISTONS_CELTICS_OPENING_INJURY: NbaInjuryReport = {
  asOfLabel: "Game day",
  home: {
    teamId: "nba-pistons",
    teamName: "Pistons",
    side: "home",
    entries: [
      {
        player: {
          id: 1631105,
          firstName: "Jalen",
          lastName: "Duren",
          position: "C",
          jerseyNumber: "0",
        },
        status: "Out",
        returnDate: "1–2 Weeks",
        injuryDetail: "Ankle / Sprain",
        description:
          "Duren (ankle) is out for the opener after a sprain in the final preseason game.",
      },
      {
        player: {
          id: 1631106,
          firstName: "Ausar",
          lastName: "Thompson",
          position: "G-F",
          jerseyNumber: "9",
        },
        status: "Questionable",
        returnDate: "Day-to-Day",
        injuryDetail: "Hip / Soreness",
        description: "Thompson (hip) is questionable and will be a game-time decision.",
      },
    ],
  },
  away: {
    teamId: "nba-celtics",
    teamName: "Celtics",
    side: "away",
    entries: [
      {
        player: {
          id: 1628369,
          firstName: "Jayson",
          lastName: "Tatum",
          position: "F",
          jerseyNumber: "0",
        },
        status: "Probable",
        returnDate: "Next Game",
        injuryDetail: "Achilles / Recovery",
        description:
          "Tatum (Achilles) is probable for the opener after a full practice.",
      },
      {
        player: {
          id: 202331,
          firstName: "Paul",
          lastName: "George",
          position: "F",
          jerseyNumber: "13",
        },
        status: "Questionable",
        returnDate: "Day-to-Day",
        injuryDetail: "Knee / Soreness",
        description: "George (knee) is questionable in his Celtics debut.",
      },
    ],
  },
};

/** homeTeamId|awayTeamId */
export const NBA_INJURY_REPORT_BY_MATCHUP: Record<string, NbaInjuryReport> = {
  "nba-pistons|nba-celtics": PISTONS_CELTICS_OPENING_INJURY,
};

export function injuryReportForMatchup(
  homeTeamId: string | undefined,
  awayTeamId: string | undefined
): NbaInjuryReport | null {
  if (!homeTeamId || !awayTeamId) return null;
  return NBA_INJURY_REPORT_BY_MATCHUP[matchupKey(homeTeamId, awayTeamId)] ?? null;
}
