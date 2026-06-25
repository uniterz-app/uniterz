/**
 * WC ブラケット — 進行・枝刈り・参加者解決・survivor 判定
 */

import type { WcGroupCode } from "@/lib/wc/groups";
import {
  type WcBracketPredictMatchId,
  type WcBracketState,
  type WcKnockoutFeedSlot,
  type WcKnockoutMatchId,
  WC_BRACKET_PREDICT_MATCH_IDS,
  WC_KNOCKOUT_BRACKET_STRUCTURE,
  WC_KNOCKOUT_MATCHES,
  getWcKnockoutMatch,
} from "@/lib/wc/wc-knockout-bracket";
import { resolveThirdPlaceTeamForWinnerSlot } from "@/lib/wc/wc-knockout-third-place";

export type WcResolvedParticipant = {
  teamId: string;
  label: string;
  source: "group" | "third_place" | "bracket_pick";
};

export type WcKnockoutAdvancement = {
  groupWinners: Partial<Record<WcGroupCode, string>>;
  groupRunnersUp: Partial<Record<WcGroupCode, string>>;
  groupThirdPlaces: Partial<Record<WcGroupCode, string>>;
  advancingThirdPlaceGroups: readonly WcGroupCode[];
};

function teamIdFromGroupSlot(
  advancement: WcKnockoutAdvancement,
  slot: Extract<WcKnockoutFeedSlot, { kind: "group_winner" | "group_runner_up" }>
): WcResolvedParticipant | null {
  const map =
    slot.kind === "group_winner"
      ? advancement.groupWinners
      : advancement.groupRunnersUp;
  const teamId = map[slot.group];
  if (!teamId) return null;
  return { teamId, label: slot.label, source: "group" };
}

function teamIdFromThirdPlaceSlot(
  advancement: WcKnockoutAdvancement,
  slot: Extract<WcKnockoutFeedSlot, { kind: "best_third" }>,
  winnerGroup: WcGroupCode | null
): WcResolvedParticipant | null {
  if (!winnerGroup) return null;
  const thirdGroup = resolveThirdPlaceTeamForWinnerSlot(
    winnerGroup,
    advancement.advancingThirdPlaceGroups,
    [...slot.candidateGroups]
  );
  if (!thirdGroup) return null;
  const teamId = advancement.groupThirdPlaces[thirdGroup];
  if (!teamId) return null;
  return {
    teamId,
    label: `3${thirdGroup}`,
    source: "third_place",
  };
}

function teamIdFromWinnerFeed(
  bracket: WcBracketState,
  slot: Extract<WcKnockoutFeedSlot, { kind: "winner_feed" }>
): WcResolvedParticipant | null {
  const pick = bracket[slot.matchId as WcBracketPredictMatchId];
  if (!pick?.winner?.trim()) return null;
  return {
    teamId: pick.winner.trim(),
    label: slot.label,
    source: "bracket_pick",
  };
}

function winnerGroupForMatch(
  def: NonNullable<ReturnType<typeof getWcKnockoutMatch>>
): WcGroupCode | null {
  if (def.home.kind === "group_winner") return def.home.group;
  if (def.away.kind === "group_winner") return def.away.group;
  return null;
}

export function resolveWcMatchParticipants(
  matchId: WcKnockoutMatchId,
  bracket: WcBracketState,
  advancement: WcKnockoutAdvancement
): [WcResolvedParticipant | null, WcResolvedParticipant | null] | null {
  const def = getWcKnockoutMatch(matchId);
  if (!def) return null;

  const winnerGroup = winnerGroupForMatch(def);

  const resolveSlot = (
    slot: WcKnockoutFeedSlot
  ): WcResolvedParticipant | null => {
    switch (slot.kind) {
      case "group_winner":
      case "group_runner_up":
        return teamIdFromGroupSlot(advancement, slot);
      case "best_third":
        return teamIdFromThirdPlaceSlot(advancement, slot, winnerGroup);
      case "winner_feed":
        return teamIdFromWinnerFeed(bracket, slot);
      default:
        return null;
    }
  };

  return [resolveSlot(def.home), resolveSlot(def.away)];
}

/** 親試合の勝者が変わったら下流の予想を削除（NBA pruneBracket 相当） */
export function pruneWcBracket(bracket: WcBracketState): WcBracketState {
  const next: WcBracketState = { ...bracket };

  for (const matchId of WC_BRACKET_PREDICT_MATCH_IDS) {
    const def = getWcKnockoutMatch(matchId);
    if (!def || def.feedsFrom.length === 0) continue;

    const allowed = def.feedsFrom
      .map((pid) => next[pid as WcBracketPredictMatchId]?.winner?.trim())
      .filter((w): w is string => Boolean(w));

    if (allowed.length !== def.feedsFrom.length) {
      delete next[matchId];
      continue;
    }

    const picked = next[matchId]?.winner?.trim();
    if (picked && !allowed.includes(picked)) {
      delete next[matchId];
    }
  }

  return next;
}

export function evaluateWcBracketSurvival(
  bracket: WcBracketState,
  officialWinners: Partial<Record<WcBracketPredictMatchId, string>>,
  matchOrder: readonly WcBracketPredictMatchId[] = WC_BRACKET_PREDICT_MATCH_IDS
): {
  alive: boolean;
  firstMissMatchId: WcBracketPredictMatchId | null;
  hitByMatch: Partial<Record<WcBracketPredictMatchId, boolean>>;
} {
  const hitByMatch: Partial<Record<WcBracketPredictMatchId, boolean>> = {};
  let firstMissMatchId: WcBracketPredictMatchId | null = null;

  for (const matchId of matchOrder) {
    const official = officialWinners[matchId]?.trim();
    if (!official) continue;

    const predicted = bracket[matchId]?.winner?.trim();
    if (!predicted) {
      hitByMatch[matchId] = false;
      if (!firstMissMatchId) firstMissMatchId = matchId;
      break;
    }

    const hit = predicted === official;
    hitByMatch[matchId] = hit;
    if (!hit) {
      if (!firstMissMatchId) firstMissMatchId = matchId;
      break;
    }
  }

  return {
    alive: firstMissMatchId === null,
    firstMissMatchId,
    hitByMatch,
  };
}

export function getWcKnockoutChildMatches(
  parentId: WcKnockoutMatchId
): WcKnockoutMatchId[] {
  return WC_KNOCKOUT_MATCHES.filter((m) => m.feedsFrom.includes(parentId)).map(
    (m) => m.id
  );
}

/** 試合ごとの判定状態（公式結果が入った試合のみ hit / miss） */
export type WcMatchHitStatus = "pending" | "hit" | "miss";

/**
 * 1 試合ぶんの hit / miss 判定。
 * 公式結果がまだ無い場合は `pending`（未判定）。
 */
export function getWcMatchHitStatus(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  officialWinners: Partial<Record<WcBracketPredictMatchId, string>>
): WcMatchHitStatus {
  const official = officialWinners[matchId]?.trim();
  if (!official) return "pending";

  const predicted = bracket[matchId]?.winner?.trim();
  if (!predicted) return "miss";

  return predicted === official ? "hit" : "miss";
}

/** 公式結果が入っている全試合の hit / miss マップ */
export function buildWcMatchHitStatusMap(
  bracket: WcBracketState,
  officialWinners: Partial<Record<WcBracketPredictMatchId, string>>
): Partial<Record<WcBracketPredictMatchId, WcMatchHitStatus>> {
  const map: Partial<Record<WcBracketPredictMatchId, WcMatchHitStatus>> = {};
  for (const matchId of WC_BRACKET_PREDICT_MATCH_IDS) {
    const status = getWcMatchHitStatus(matchId, bracket, officialWinners);
    if (status !== "pending") {
      map[matchId] = status;
    }
  }
  return map;
}

/** matchId が ancestor の子孫（下流）か */
export function isWcKnockoutDescendantOf(
  matchId: WcKnockoutMatchId,
  ancestorId: WcKnockoutMatchId
): boolean {
  if (matchId === ancestorId) return false;
  const visited = new Set<WcKnockoutMatchId>();
  const queue = getWcKnockoutChildMatches(ancestorId);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === matchId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    queue.push(...getWcKnockoutChildMatches(cur));
  }
  return false;
}

/**
 * survivor 表示で試合スロットを出すか。
 * - 最初の miss 試合と、その下流（子孫）は非表示
 * - それ以外は pending / hit を表示
 */
export function isWcSurvivorMatchVisible(
  matchId: WcBracketPredictMatchId,
  firstMissMatchId: WcBracketPredictMatchId | null
): boolean {
  if (!firstMissMatchId) return true;
  if (matchId === firstMissMatchId) return false;
  return !isWcKnockoutDescendantOf(matchId, firstMissMatchId);
}

/**
 * 「的中したスロットだけ残す」表示用。
 * - hit → 表示
 * - pending → 脱落前のみ表示（脱落後は未判定も隠す）
 * - miss / 脱落下流 → 非表示
 */
export function shouldShowWcSurvivorPick(
  matchId: WcBracketPredictMatchId,
  hitStatus: WcMatchHitStatus,
  firstMissMatchId: WcBracketPredictMatchId | null
): boolean {
  if (!isWcSurvivorMatchVisible(matchId, firstMissMatchId)) return false;
  if (hitStatus === "hit") return true;
  if (hitStatus === "miss") return false;
  return firstMissMatchId === null;
}

/**
 * ノックアウト試合が 1 試合 final になるたびに呼ぶ想定。
 * その試合だけ hit / miss を返し、累積 officialWinners と合わせて survivor を更新する。
 */
export function evaluateWcBracketSurvivalForMatch(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  officialWinner: string,
  priorOfficialWinners: Partial<Record<WcBracketPredictMatchId, string>> = {}
): {
  hit: boolean;
  status: WcMatchHitStatus;
  survival: ReturnType<typeof evaluateWcBracketSurvival>;
} {
  const officialWinners = {
    ...priorOfficialWinners,
    [matchId]: officialWinner,
  };
  const status = getWcMatchHitStatus(matchId, bracket, officialWinners);
  const survival = evaluateWcBracketSurvival(bracket, officialWinners);
  return {
    hit: status === "hit",
    status,
    survival,
  };
}

export { WC_KNOCKOUT_BRACKET_STRUCTURE };
