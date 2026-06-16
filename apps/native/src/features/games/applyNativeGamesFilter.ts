import type { TeamFilterMatchMode, TeamNameById } from "../../../../../lib/games/gameTeamFilter";
import {
  gameInvolvesAnyTeam,
  gameIsHeadToHeadBetween,
} from "../../../../../lib/games/gameTeamFilter";
import { gameMatchesMarginBounds } from "../../../../../lib/games/marginFilter";
import type { NativeGameRow } from "./useTodayGames";

export type GamesFilterState = {
  /** 最大2件のチーム doc ID */
  selectedTeamIds: string[];
  matchMode: TeamFilterMatchMode;
  marginMin: string;
  marginMax: string;
};

function parseMarginDraft(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0 || n > 200) return null;
  return n;
}

/** Web `GamesPage` のチーム・点差フィルター相当 */
export function applyNativeGamesFilter(
  games: NativeGameRow[],
  filter: GamesFilterState,
  nameById: TeamNameById
): NativeGameRow[] {
  let list = games;

  const teamIds = filter.selectedTeamIds.filter(Boolean).slice(0, 2);
  if (teamIds.length > 0) {
    list = list.filter((game) => {
      const row = game as Record<string, unknown>;
      if (teamIds.length === 2 && filter.matchMode === "h2h") {
        return gameIsHeadToHeadBetween(row, teamIds, nameById);
      }
      return gameInvolvesAnyTeam(row, teamIds, nameById);
    });
  }

  const marginMin = parseMarginDraft(filter.marginMin);
  const marginMax = parseMarginDraft(filter.marginMax);
  if (marginMin != null || marginMax != null) {
    list = list.filter((game) =>
      gameMatchesMarginBounds(game as Record<string, unknown>, marginMin, marginMax)
    );
  }

  return list;
}

export function gamesFilterIsActive(filter: GamesFilterState): boolean {
  return Boolean(
    filter.selectedTeamIds.length > 0 ||
      filter.marginMin.trim() ||
      filter.marginMax.trim()
  );
}
