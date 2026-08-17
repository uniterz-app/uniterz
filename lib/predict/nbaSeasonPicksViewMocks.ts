/**
 * 提出済みシーズン予想の閲覧用モック
 */

import { NBA_EAST_TEAM_IDS, NBA_WEST_TEAM_IDS } from "@/lib/nba/nbaConferenceTeams";
import type { NbaSeasonAwardsPrediction } from "@/lib/predict/nbaSeasonAwardsPredict";
import type {
  NbaConferenceStandingsPicks,
  NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";

function zipRanks(teamIds: readonly string[]): NbaConferenceStandingsPicks {
  const picks: NbaConferenceStandingsPicks = {};
  teamIds.forEach((id, i) => {
    picks[i + 1] = id;
  });
  return picks;
}

/** プレビュー用・提出済み順位（見やすさ優先の仮並べ） */
export const MOCK_SUBMITTED_STANDINGS: NbaSeasonStandingsPrediction = {
  season: "2026-27",
  east: zipRanks([
    "nba-cavaliers",
    "nba-celtics",
    "nba-knicks",
    "nba-magic",
    "nba-bucks",
    "nba-pistons",
    "nba-hawks",
    "nba-heat",
    "nba-pacers",
    "nba-bulls",
    "nba-76ers",
    "nba-hornets",
    "nba-nets",
    "nba-raptors",
    "nba-wizards",
  ]),
  west: zipRanks([
    "nba-thunder",
    "nba-rockets",
    "nba-nuggets",
    "nba-timberwolves",
    "nba-lakers",
    "nba-clippers",
    "nba-warriors",
    "nba-grizzlies",
    "nba-mavericks",
    "nba-spurs",
    "nba-suns",
    "nba-kings",
    "nba-blazers",
    "nba-pelicans",
    "nba-jazz",
  ]),
};

export const MOCK_SUBMITTED_AWARDS: NbaSeasonAwardsPrediction = {
  season: "2026-27",
  picks: {
    mvp: "p-jokic",
    dpoy: "p-wembanyama",
    roy: "p-flage",
    mip: "p-cade",
    sixth: "p-reed",
    coy: "p-shai",
    coty: "c-daigneault",
  },
};

/** 会議別チーム数が揃っていることの簡易ガード（dev 用） */
export function assertMockStandingsCoverConferences(): boolean {
  return (
    NBA_EAST_TEAM_IDS.length === 15 &&
    NBA_WEST_TEAM_IDS.length === 15 &&
    Object.keys(MOCK_SUBMITTED_STANDINGS.east).length === 15 &&
    Object.keys(MOCK_SUBMITTED_STANDINGS.west).length === 15
  );
}
