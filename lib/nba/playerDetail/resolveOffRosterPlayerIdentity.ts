/**
 * ロスター外プレイヤーの氏名・最終所属。
 * leaders / awards の静的表から（クライアント可）。
 */
import {
  NBA_ALL_DEF_1ST_SEASON_WINNERS,
  NBA_ALL_DEF_2ND_SEASON_WINNERS,
  NBA_ALL_NBA_1ST_SEASON_WINNERS,
  NBA_ALL_NBA_2ND_SEASON_WINNERS,
  NBA_ALL_NBA_3RD_SEASON_WINNERS,
  NBA_ALL_ROOKIE_1ST_SEASON_WINNERS,
  NBA_ALL_ROOKIE_2ND_SEASON_WINNERS,
  NBA_AST_CHAMP_SEASON_WINNERS,
  NBA_BLK_CHAMP_SEASON_WINNERS,
  NBA_CLUTCH_SEASON_WINNERS,
  NBA_CONF_FINALS_MVP_SEASON_WINNERS,
  NBA_CUP_MVP_SEASON_WINNERS,
  NBA_DPOY_SEASON_WINNERS,
  NBA_FMVP_SEASON_WINNERS,
  NBA_MIP_SEASON_WINNERS,
  NBA_MVP_SEASON_WINNERS,
  NBA_REB_CHAMP_SEASON_WINNERS,
  NBA_ROY_SEASON_WINNERS,
  NBA_SCORING_CHAMP_SEASON_WINNERS,
  NBA_SMOY_SEASON_WINNERS,
  NBA_STL_CHAMP_SEASON_WINNERS,
  type NbaPlayerAwardSeasonWinner,
} from "@/lib/nba/playerAwards/nbaPlayerAwardSeasonWinners";
import { NBA_ALL_STAR_SEASON_WINNERS } from "@/lib/nba/playerAwards/nbaAllStarSeasonWinners";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";

export type OffRosterPlayerIdentity = {
  playerName: string;
  teamId: string;
  conference?: NbaConferenceId | null;
};

const AWARD_NAME_ROWS: readonly (readonly NbaPlayerAwardSeasonWinner[])[] = [
  NBA_MVP_SEASON_WINNERS,
  NBA_FMVP_SEASON_WINNERS,
  NBA_DPOY_SEASON_WINNERS,
  NBA_ROY_SEASON_WINNERS,
  NBA_MIP_SEASON_WINNERS,
  NBA_SMOY_SEASON_WINNERS,
  NBA_CLUTCH_SEASON_WINNERS,
  NBA_SCORING_CHAMP_SEASON_WINNERS,
  NBA_AST_CHAMP_SEASON_WINNERS,
  NBA_REB_CHAMP_SEASON_WINNERS,
  NBA_STL_CHAMP_SEASON_WINNERS,
  NBA_BLK_CHAMP_SEASON_WINNERS,
  NBA_ALL_NBA_1ST_SEASON_WINNERS,
  NBA_ALL_NBA_2ND_SEASON_WINNERS,
  NBA_ALL_NBA_3RD_SEASON_WINNERS,
  NBA_ALL_DEF_1ST_SEASON_WINNERS,
  NBA_ALL_DEF_2ND_SEASON_WINNERS,
  NBA_ALL_ROOKIE_1ST_SEASON_WINNERS,
  NBA_ALL_ROOKIE_2ND_SEASON_WINNERS,
  NBA_CUP_MVP_SEASON_WINNERS,
  NBA_CONF_FINALS_MVP_SEASON_WINNERS,
];

let nameByIdCache: Map<string, string> | null = null;

function awardNameByPlayerId(): Map<string, string> {
  if (nameByIdCache) return nameByIdCache;
  const out = new Map<string, string>();
  for (const rows of AWARD_NAME_ROWS) {
    for (const row of rows) {
      const id = String(row.playerId ?? "").trim();
      const name = String(row.playerName ?? "").trim();
      if (!id || !name || out.has(id)) continue;
      out.set(id, name);
    }
  }
  for (const row of NBA_ALL_STAR_SEASON_WINNERS) {
    const id = String(row.playerId ?? "").trim();
    const name = String(row.playerName ?? "").trim();
    if (!id || !name || out.has(id)) continue;
    out.set(id, name);
  }
  nameByIdCache = out;
  return out;
}

/** curated awards から氏名だけ取る（チーム不明可） */
export function resolveOffRosterPlayerNameFromAwards(
  playerId: string | null | undefined
): string | null {
  const id = String(playerId ?? "").trim();
  if (!id) return null;
  return awardNameByPlayerId().get(id) ?? null;
}

export function splitPlayerFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "—", lastName: "—" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}
