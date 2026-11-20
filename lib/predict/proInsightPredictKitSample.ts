/**
 * __DEV__ プレビューと Free ゲートの画面例（先頭）用。2026-11-12 の実データ（scripts/refresh-predict-kits.ts --json）を写したもの。
 */
import type { ProInsightPredictKit } from "@/lib/nba/insights/predictKit/predictKitTypes";

export type ProInsightPredictKitSample = {
  homeTeamId: string;
  awayTeamId: string;
  kit: ProInsightPredictKit;
  /** その時点の UNITERZ のみんなの予想（ホームを選んだ割合 % と人数） */
  crowd?: { homePct: number; total: number };
};

export const PRO_INSIGHT_PREDICT_KIT_SAMPLES: ProInsightPredictKitSample[] = [
  {
    homeTeamId: "nba-wizards",
    awayTeamId: "nba-pistons",
    kit: {
      v: 2,
      favoredTeamId: "nba-pistons",
      lean: "clear",
      winPct: 84,
      margin: 13.8,
      pace: "low",
      score: {
        home: 103,
        away: 117,
        total: 219,
        low: 206,
        high: 232,
        leagueTotal: 227
      },
      teams: [
        {
          teamId: "nba-wizards",
          wins: 4,
          losses: 8,
          margin: -5.9,
          pf: 107.5,
          pa: 113.4
        },
        {
          teamId: "nba-pistons",
          wins: 7,
          losses: 3,
          margin: 8.1,
          pf: 112.7,
          pa: 104.6
        }
      ],
      factors: [
        {
          kind: "strength",
          teamId: "nba-pistons",
          pts: 12
        },
        {
          kind: "b2b",
          teamId: "nba-wizards",
          pts: 2.7
        },
        {
          kind: "home",
          teamId: "nba-wizards",
          pts: 1.9
        }
      ],
      absences: [
        {
          teamId: "nba-wizards",
          out: [
            "J.CHAMPAGNIE",
            "J.WATKINS"
          ],
          questionable: []
        },
        {
          teamId: "nba-pistons",
          out: [
            "I.JOE",
            "J.DUREN"
          ],
          questionable: [
            "E.HARKLESS"
          ]
        }
      ],
      strengthBasis: "cleanSos",
      scorers: [
        {
          playerId: "117",
          teamId: "nba-wizards",
          name: "A.DAVIS",
          pct: 38,
          ppg: 25.7
        },
        {
          playerId: "17896075",
          teamId: "nba-pistons",
          name: "C.CUNNINGHAM",
          pct: 26,
          ppg: 22.3
        },
        {
          playerId: "1028026060",
          teamId: "nba-wizards",
          name: "K.GEORGE",
          pct: 11,
          ppg: 17.9
        }
      ]
    },
    crowd: {
      homePct: 16.8,
      total: 291
    }
  },
  {
    homeTeamId: "nba-76ers",
    awayTeamId: "nba-raptors",
    kit: {
      v: 2,
      favoredTeamId: "nba-76ers",
      lean: "slight",
      winPct: 64,
      margin: 4.9,
      pace: "mid",
      score: {
        home: 113,
        away: 108,
        total: 222,
        low: 209,
        high: 235,
        leagueTotal: 227
      },
      teams: [
        {
          teamId: "nba-76ers",
          wins: 9,
          losses: 3,
          margin: 1,
          pf: 110.2,
          pa: 109.2
        },
        {
          teamId: "nba-raptors",
          wins: 5,
          losses: 6,
          margin: 2.5,
          pf: 114.5,
          pa: 111.9
        }
      ],
      factors: [
        {
          kind: "b2b",
          teamId: "nba-raptors",
          pts: 2.7
        },
        {
          kind: "home",
          teamId: "nba-76ers",
          pts: 1.9
        },
        {
          kind: "injury",
          teamId: "nba-raptors",
          pts: 1.8
        }
      ],
      absences: [
        {
          teamId: "nba-76ers",
          out: [
            "A.BONA",
            "D.BARLOW"
          ],
          questionable: [
            "J.EMBIID",
            "L.JAMES"
          ]
        },
        {
          teamId: "nba-raptors",
          out: [
            "K.LEONARD",
            "S.BARNES"
          ],
          questionable: []
        }
      ],
      strengthBasis: "cleanSos",
      scorers: [
        {
          playerId: "3547254",
          teamId: "nba-76ers",
          name: "T.MAXEY",
          pct: 41,
          ppg: 26.7
        },
        {
          playerId: "70",
          teamId: "nba-76ers",
          name: "J.BROWN",
          pct: 28,
          ppg: 21.5
        },
        {
          playerId: "666423",
          teamId: "nba-raptors",
          name: "R.BARRETT",
          pct: 15,
          ppg: 21.3
        }
      ]
    },
    crowd: {
      homePct: 95,
      total: 300
    }
  },
  {
    homeTeamId: "nba-timberwolves",
    awayTeamId: "nba-mavericks",
    kit: {
      v: 2,
      favoredTeamId: "nba-timberwolves",
      lean: "slight",
      winPct: 68,
      margin: 6.4,
      pace: "mid",
      score: {
        home: 116,
        away: 110,
        total: 226,
        low: 213,
        high: 239,
        leagueTotal: 227
      },
      teams: [
        {
          teamId: "nba-timberwolves",
          wins: 8,
          losses: 3,
          margin: 11.1,
          pf: 118.1,
          pa: 107
        },
        {
          teamId: "nba-mavericks",
          wins: 7,
          losses: 4,
          margin: 4.6,
          pf: 114.9,
          pa: 110.3
        }
      ],
      factors: [
        {
          kind: "strength",
          teamId: "nba-timberwolves",
          pts: 4.3
        },
        {
          kind: "home",
          teamId: "nba-timberwolves",
          pts: 1.9
        },
        {
          kind: "rested",
          teamId: "nba-timberwolves",
          pts: 1.3
        }
      ],
      absences: [
        {
          teamId: "nba-timberwolves",
          out: [
            "A.EDWARDS",
            "D.DIVINCENZO"
          ],
          questionable: []
        },
        {
          teamId: "nba-mavericks",
          out: [
            "D.LIVELY II"
          ],
          questionable: []
        }
      ],
      strengthBasis: "cleanSos",
      scorers: [
        {
          playerId: "1057262088",
          teamId: "nba-mavericks",
          name: "C.FLAGG",
          pct: 34,
          ppg: 25.9
        },
        {
          playerId: "228",
          teamId: "nba-mavericks",
          name: "K.IRVING",
          pct: 32,
          ppg: 22.9
        },
        {
          playerId: "3547239",
          teamId: "nba-timberwolves",
          name: "L.BALL",
          pct: 14,
          ppg: 18.3
        }
      ]
    },
    crowd: {
      homePct: 44.2,
      total: 294
    }
  },
  {
    homeTeamId: "nba-suns",
    awayTeamId: "nba-hornets",
    kit: {
      v: 2,
      favoredTeamId: "nba-suns",
      lean: "slight",
      winPct: 67,
      margin: 6.1,
      pace: "low",
      score: {
        home: 112,
        away: 106,
        total: 217,
        low: 204,
        high: 230,
        leagueTotal: 227
      },
      teams: [
        {
          teamId: "nba-suns",
          wins: 4,
          losses: 6,
          margin: -5.3,
          pf: 112.8,
          pa: 118.1
        },
        {
          teamId: "nba-hornets",
          wins: 4,
          losses: 7,
          margin: -11.5,
          pf: 98.8,
          pa: 110.4
        }
      ],
      factors: [
        {
          kind: "strength",
          teamId: "nba-suns",
          pts: 3.6
        },
        {
          kind: "home",
          teamId: "nba-suns",
          pts: 1.9
        }
      ],
      absences: [
        {
          teamId: "nba-suns",
          out: [
            "M.WILLIAMS"
          ],
          questionable: []
        },
        {
          teamId: "nba-hornets",
          out: [
            "B.MILLER",
            "D.SCHRODER",
            "K.KNUEPPEL"
          ],
          questionable: []
        }
      ],
      strengthBasis: "cleanSos",
      scorers: [
        {
          playerId: "57",
          teamId: "nba-suns",
          name: "D.BOOKER",
          pct: 54,
          ppg: 25.1
        },
        {
          playerId: "8",
          teamId: "nba-hornets",
          name: "G.ALLEN",
          pct: 12,
          ppg: 15.3
        },
        {
          playerId: "667378",
          teamId: "nba-hornets",
          name: "N.REID",
          pct: 10,
          ppg: 17.4
        }
      ]
    },
    crowd: {
      homePct: 84.5,
      total: 116
    }
  }
];
