/**
 * NBA トレード予想バレット（TDL）— 型・枠・提出判定。
 *
 * 配点は `nbaTradeBallotScoring`（1 枠 100・合計 700 点満点）。
 * 日程・枠ロックは `nbaTradeBallotDeadline`。
 */
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";
import {
  awardCandidateLabel,
  filterAwardCandidatesByPrefix,
  normalizeAwardQuery,
  popularAwardPicks,
  type NbaAwardCandidate,
} from "@/lib/predict/nbaSeasonAwardsPredict";

export const TRADE_BALLOT_SLOT_COUNT = 7;

export type NbaTradeBallotPick = {
  playerId: string | null;
  /** 移籍先チーム（`nba-lakers` など）。必須 */
  toTeamId: string | null;
};

export type NbaTradeBallotPrediction = {
  season: string;
  picks: NbaTradeBallotPick[];
};

export type NbaTradeBallotTeamOption = {
  teamId: string;
  abbr: string;
  name: string;
};

export function emptyTradeBallotPick(): NbaTradeBallotPick {
  return { playerId: null, toTeamId: null };
}

export function emptyTradeBallotPrediction(
  season: string
): NbaTradeBallotPrediction {
  return {
    season,
    picks: Array.from({ length: TRADE_BALLOT_SLOT_COUNT }, () =>
      emptyTradeBallotPick()
    ),
  };
}

export function filledTradeBallotCount(
  picks: readonly NbaTradeBallotPick[]
): number {
  let n = 0;
  for (const p of picks) {
    if (
      typeof p.playerId === "string" &&
      p.playerId.trim() &&
      typeof p.toTeamId === "string" &&
      p.toTeamId.trim()
    ) {
      n += 1;
    }
  }
  return n;
}

export function isTradeBallotSlotComplete(pick: NbaTradeBallotPick): boolean {
  return (
    typeof pick.playerId === "string" &&
    pick.playerId.trim().length > 0 &&
    typeof pick.toTeamId === "string" &&
    pick.toTeamId.trim().length > 0
  );
}

export function isTradeBallotComplete(
  pred: NbaTradeBallotPrediction
): boolean {
  if (pred.picks.length !== TRADE_BALLOT_SLOT_COUNT) return false;
  return pred.picks.every(isTradeBallotSlotComplete);
}

/** 同じ選手を 2 枠に入れない */
export function tradeBallotUsedPlayerIds(
  picks: readonly NbaTradeBallotPick[],
  exceptIndex?: number
): Set<string> {
  const used = new Set<string>();
  picks.forEach((p, i) => {
    if (exceptIndex != null && i === exceptIndex) return;
    const id = typeof p.playerId === "string" ? p.playerId.trim() : "";
    if (id) used.add(id);
  });
  return used;
}

export function nbaTradeBallotTeamOptions(): NbaTradeBallotTeamOption[] {
  return Object.keys(NBA_TEAM_NAME_BY_ID)
    .map((teamId) => {
      const abbr = (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "")).toUpperCase();
      return {
        teamId,
        abbr,
        name: NBA_TEAM_NAME_BY_ID[teamId] ?? abbr,
      };
    })
    .sort((a, b) => a.abbr.localeCompare(b.abbr, "en"));
}

export function tradeBallotTeamById(
  teamId: string | null | undefined
): NbaTradeBallotTeamOption | null {
  if (!teamId) return null;
  const id = teamId.trim();
  if (!id) return null;
  const name = NBA_TEAM_NAME_BY_ID[id];
  if (!name) return null;
  return {
    teamId: id,
    abbr: (TEAM_SHORT[id] ?? id.replace(/^nba-/, "")).toUpperCase(),
    name,
  };
}

/** 今の所属チームは行き先に選べない */
export function tradeBallotDestinationTeams(
  fromTeamAbbr: string | null | undefined
): NbaTradeBallotTeamOption[] {
  const from = (fromTeamAbbr ?? "").trim().toUpperCase();
  return nbaTradeBallotTeamOptions().filter((t) =>
    from ? t.abbr !== from : true
  );
}

export function filterTradeBallotTeamsByPrefix(
  teams: readonly NbaTradeBallotTeamOption[],
  query: string,
  limit = 30
): NbaTradeBallotTeamOption[] {
  const q = normalizeAwardQuery(query);
  if (!q) return teams.slice(0, limit);
  const scored: { t: NbaTradeBallotTeamOption; score: number }[] = [];
  for (const t of teams) {
    const abbr = normalizeAwardQuery(t.abbr);
    const name = normalizeAwardQuery(t.name);
    let score = -1;
    if (abbr.startsWith(q)) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    if (score >= 0) scored.push({ t, score });
  }
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.t.abbr.localeCompare(b.t.abbr, "en");
  });
  return scored.slice(0, limit).map((x) => x.t);
}

export {
  awardCandidateLabel,
  filterAwardCandidatesByPrefix,
  popularAwardPicks,
  type NbaAwardCandidate,
};
