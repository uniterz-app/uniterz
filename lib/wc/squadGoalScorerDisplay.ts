import { getClubLeagueIso2 } from "@/lib/wc/clubLeagueCountry";
import type { WcPosition } from "@/lib/wc/rosters";
import { getWcPredictedLineup } from "@/lib/wc/squads";
import type { WcSquadPlayer } from "@/lib/wc/squadTypes";

const POS_ORDER: Record<WcPosition, number> = {
  FW: 0,
  MF: 1,
  DF: 2,
  GK: 3,
};

export type GoalScorerSquadRow = {
  player: WcSquadPlayer;
  /** 予想スタメン11人に含まれる */
  isStarter: boolean;
};

export function starterPlayerIdsForTeam(teamId: string): Set<string> {
  const lineup = getWcPredictedLineup(teamId);
  if (!lineup?.slots?.length) return new Set();
  return new Set(lineup.slots.map((s) => s.playerId));
}

function sortByPositionThenName(
  rows: GoalScorerSquadRow[]
): GoalScorerSquadRow[] {
  return [...rows].sort((a, b) => {
    const posDiff = POS_ORDER[a.player.pos] - POS_ORDER[b.player.pos];
    if (posDiff !== 0) return posDiff;
    return a.player.name.localeCompare(b.player.name, undefined, {
      sensitivity: "base",
    });
  });
}

export type GoalScorerSquadSections = {
  /** FW→GK。スタメン情報がない場合は全選手 */
  starters: GoalScorerSquadRow[];
  /** FW→GK。スタメン以外 */
  bench: GoalScorerSquadRow[];
  /** 予想スタメンあり → スタメン/ベンチで区切る */
  hasLineupSplit: boolean;
};

/** 得点者ピッカー用 — [スタメン FW→GK] | [ベンチ FW→GK] */
export function buildGoalScorerSquadSections(
  squad: WcSquadPlayer[],
  teamId: string
): GoalScorerSquadSections {
  const starterIds = starterPlayerIdsForTeam(teamId);
  const hasLineupSplit = starterIds.size > 0;

  const rows = squad.map((player) => ({
    player,
    isStarter: starterIds.has(player.id),
  }));

  if (!hasLineupSplit) {
    return {
      starters: sortByPositionThenName(rows),
      bench: [],
      hasLineupSplit: false,
    };
  }

  return {
    starters: sortByPositionThenName(rows.filter((r) => r.isStarter)),
    bench: sortByPositionThenName(rows.filter((r) => !r.isStarter)),
    hasLineupSplit: true,
  };
}

/** @deprecated buildGoalScorerSquadSections を使用 */
export function buildGoalScorerSquadRows(
  squad: WcSquadPlayer[],
  teamId: string
): GoalScorerSquadRow[] {
  const { starters, bench, hasLineupSplit } = buildGoalScorerSquadSections(
    squad,
    teamId
  );
  if (!hasLineupSplit) return starters;
  return [...starters, ...bench];
}

export function resolveGoalScorerPlayerClub(player: WcSquadPlayer): {
  club: string | null;
  leagueIso2: string | null;
} {
  const club = player.club?.trim() || null;
  if (!club) return { club: null, leagueIso2: null };
  return {
    club,
    leagueIso2: getClubLeagueIso2(club, player.leagueIso2),
  };
}
