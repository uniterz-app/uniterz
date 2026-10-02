/**
 * キャリア表用: プレイヤー×シーズンの短いアワードラベル。
 * 優勝ハイライトは「そのシーズンの優勝チームでプレーオフ出場」で判定。
 */
import { championshipTeamForSeasonKey } from "@/lib/nba/playerAwards/nbaChampionshipTeams";
import {
  NBA_PLAYER_AWARD_CATALOG,
  type NbaPlayerAwardId,
} from "@/lib/nba/playerAwards/nbaPlayerAwardCatalog";
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
  NBA_PLAYER_AWARDS_INGESTED,
  NBA_REB_CHAMP_SEASON_WINNERS,
  NBA_ROY_SEASON_WINNERS,
  NBA_SCORING_CHAMP_SEASON_WINNERS,
  NBA_SMOY_SEASON_WINNERS,
  NBA_STL_CHAMP_SEASON_WINNERS,
  type NbaPlayerAwardSeasonWinner,
} from "@/lib/nba/playerAwards/nbaPlayerAwardSeasonWinners";
import { NBA_ALL_STAR_SEASON_WINNERS } from "@/lib/nba/playerAwards/nbaAllStarSeasonWinners";

/** キャリア表チップ用の短いラベル（カタログ順） */
export const NBA_PLAYER_AWARD_SHORT_LABEL_BY_ID: Record<
  NbaPlayerAwardId,
  string
> = {
  championship: "Champ",
  mvp: "MVP",
  fmvp: "FMVP",
  dpoy: "DPOY",
  roy: "ROY",
  mip: "MIP",
  smoy: "6MOY",
  clutch: "CPOY",
  scoring_champ: "Scoring",
  ast_champ: "AST",
  reb_champ: "REB",
  stl_champ: "STL",
  blk_champ: "BLK",
  all_star: "AS",
  all_nba_1st: "All-NBA1",
  all_nba_2nd: "All-NBA2",
  all_nba_3rd: "All-NBA3",
  all_def_1st: "All-D1",
  all_def_2nd: "All-D2",
  all_rookie_1st: "All-R1",
  all_rookie_2nd: "All-R2",
  nba_cup_mvp: "Cup MVP",
  conf_finals_mvp: "CF MVP",
};

export type CareerSeasonAwardChip = {
  id: NbaPlayerAwardId;
  short: string;
};

/** seasonStart（例: 2020）→ "2020-21" */
export function seasonKeyFromSeasonStart(seasonStart: number): string {
  return `${seasonStart}-${String(seasonStart + 1).slice(-2)}`;
}

const SEASON_WINNERS_BY_AWARD: Partial<
  Record<NbaPlayerAwardId, readonly NbaPlayerAwardSeasonWinner[]>
> = {
  mvp: NBA_MVP_SEASON_WINNERS,
  fmvp: NBA_FMVP_SEASON_WINNERS,
  dpoy: NBA_DPOY_SEASON_WINNERS,
  roy: NBA_ROY_SEASON_WINNERS,
  mip: NBA_MIP_SEASON_WINNERS,
  smoy: NBA_SMOY_SEASON_WINNERS,
  clutch: NBA_CLUTCH_SEASON_WINNERS,
  scoring_champ: NBA_SCORING_CHAMP_SEASON_WINNERS,
  ast_champ: NBA_AST_CHAMP_SEASON_WINNERS,
  reb_champ: NBA_REB_CHAMP_SEASON_WINNERS,
  stl_champ: NBA_STL_CHAMP_SEASON_WINNERS,
  blk_champ: NBA_BLK_CHAMP_SEASON_WINNERS,
  all_star: NBA_ALL_STAR_SEASON_WINNERS,
  all_nba_1st: NBA_ALL_NBA_1ST_SEASON_WINNERS,
  all_nba_2nd: NBA_ALL_NBA_2ND_SEASON_WINNERS,
  all_nba_3rd: NBA_ALL_NBA_3RD_SEASON_WINNERS,
  all_def_1st: NBA_ALL_DEF_1ST_SEASON_WINNERS,
  all_def_2nd: NBA_ALL_DEF_2ND_SEASON_WINNERS,
  all_rookie_1st: NBA_ALL_ROOKIE_1ST_SEASON_WINNERS,
  all_rookie_2nd: NBA_ALL_ROOKIE_2ND_SEASON_WINNERS,
  nba_cup_mvp: NBA_CUP_MVP_SEASON_WINNERS,
  conf_finals_mvp: NBA_CONF_FINALS_MVP_SEASON_WINNERS,
};

type AwardIndex = Map<string, Map<string, NbaPlayerAwardId[]>>;

/** 同一シーズンに複数 All-NBA / All-Def が付いた場合は上位のみ残す */
function dedupeExclusiveSeasonAwards(
  ids: readonly NbaPlayerAwardId[]
): NbaPlayerAwardId[] {
  const set = new Set(ids);
  if (set.has("all_nba_1st")) {
    set.delete("all_nba_2nd");
    set.delete("all_nba_3rd");
  } else if (set.has("all_nba_2nd")) {
    set.delete("all_nba_3rd");
  }
  if (set.has("all_def_1st")) set.delete("all_def_2nd");
  return ids.filter((id) => set.has(id));
}

function buildAwardIndex(): AwardIndex {
  const index: AwardIndex = new Map();
  for (const awardId of NBA_PLAYER_AWARDS_INGESTED) {
    const rows = SEASON_WINNERS_BY_AWARD[awardId];
    if (!rows) continue;
    for (const row of rows) {
      const pid = String(row.playerId).trim();
      if (!pid) continue;
      let bySeason = index.get(pid);
      if (!bySeason) {
        bySeason = new Map();
        index.set(pid, bySeason);
      }
      const list = bySeason.get(row.seasonKey) ?? [];
      if (!list.includes(awardId)) list.push(awardId);
      bySeason.set(row.seasonKey, list);
    }
  }

  const catalogOrder = new Map(
    NBA_PLAYER_AWARD_CATALOG.map((e, i) => [e.id, i])
  );
  for (const bySeason of index.values()) {
    for (const [key, ids] of bySeason) {
      bySeason.set(
        key,
        dedupeExclusiveSeasonAwards(ids).sort(
          (a, b) => (catalogOrder.get(a) ?? 999) - (catalogOrder.get(b) ?? 999)
        )
      );
    }
  }
  return index;
}

function getAwardIndex(): AwardIndex {
  // 小さな静的表なので毎回構築。HMR で winners だけ更新されたときに古い index が残らないようにする
  return buildAwardIndex();
}

/** そのプレイヤー・シーズンの短いアワードチップ（カタログ順） */
export function careerSeasonAwardChipsForPlayer(
  playerId: string | null | undefined,
  seasonStart: number
): CareerSeasonAwardChip[] {
  const pid = String(playerId ?? "").trim();
  if (!pid) return [];
  const seasonKey = seasonKeyFromSeasonStart(seasonStart);
  const ids = getAwardIndex().get(pid)?.get(seasonKey) ?? [];
  return ids.map((id) => ({
    id,
    short: NBA_PLAYER_AWARD_SHORT_LABEL_BY_ID[id],
  }));
}

/** キャリア通してアワードが1つもない（列ごと非表示用） */
export function playerHasAnyCareerSeasonAward(
  playerId: string | null | undefined
): boolean {
  const pid = String(playerId ?? "").trim();
  if (!pid) return false;
  const bySeason = getAwardIndex().get(pid);
  if (!bySeason || bySeason.size === 0) return false;
  for (const ids of bySeason.values()) {
    if (ids.length > 0) return true;
  }
  return false;
}

/**
 * Playoffs 行を優勝ハイライトするか。
 * そのシーズンの優勝チームに在籍し、プレーオフ出場行があること（呼び出し側で board=playoffs）。
 */
export function isPlayerChampionshipSeason(
  seasonStart: number,
  opts?: {
    teamAbbr?: string | null;
    teamId?: string | null;
  }
): boolean {
  const champ = championshipTeamForSeasonKey(
    seasonKeyFromSeasonStart(seasonStart)
  );
  if (!champ) return false;
  const teamId = String(opts?.teamId ?? "").trim();
  if (teamId && teamId === champ.teamId) return true;
  const abbr = String(opts?.teamAbbr ?? "")
    .trim()
    .toUpperCase();
  return abbr.length > 0 && abbr === champ.teamAbbr;
}

/** そのシーズンの優勝チームに在籍したシーズン数（同一シーズンは1回。Regular / Playoffs どちらでも可） */
export function countCareerChampionships(
  seasonRows: readonly {
    seasonStart: number;
    teamAbbr?: string | null;
    teamId?: string | null;
  }[]
): number {
  const seasons = new Set<number>();
  for (const row of seasonRows) {
    if (
      !Number.isFinite(row.seasonStart) ||
      !isPlayerChampionshipSeason(row.seasonStart, {
        teamAbbr: row.teamAbbr,
        teamId: row.teamId,
      })
    ) {
      continue;
    }
    seasons.add(row.seasonStart);
  }
  return seasons.size;
}

export const CAREER_CHAMPIONSHIP_AWARD_ID = "championship" as const;

export const CAREER_CHAMPIONSHIP_ROW_COLOR = "#FBBF24";
