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
