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
import type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";

export type WcResolveParticipantsOptions = {
  officialWinners?: WcOfficialWinners | null;
  /** true のとき winner_feed は公式勝者を優先（R16+ 表示用） */
  preferOfficialFeeders?: boolean;
};

export type WcResolvedParticipant = {
  /** 未確定の winner_feed などは空文字 */
  teamId: string;
  label: string;
  source: "group" | "third_place" | "bracket_pick" | "official";
};

export type WcKnockoutAdvancement = {
  groupWinners: Partial<Record<WcGroupCode, string>>;
  groupRunnersUp: Partial<Record<WcGroupCode, string>>;
  groupThirdPlaces: Partial<Record<WcGroupCode, string>>;
  advancingThirdPlaceGroups: readonly WcGroupCode[];
};

/** FIFA 表記ラベル（1F / 2A / 3B）から teamId を引く */
export function resolveWcQualLabelToTeamId(
  label: string,
  advancement: WcKnockoutAdvancement
): string | null {
  const m = label.trim().match(/^([123])([A-L])$/);
  if (!m) return null;
  const rank = m[1];
  const group = m[2] as WcGroupCode;
  if (rank === "1") return advancement.groupWinners[group]?.trim() || null;
  if (rank === "2") return advancement.groupRunnersUp[group]?.trim() || null;
  if (rank === "3") return advancement.groupThirdPlaces[group]?.trim() || null;
  return null;
}

/** グループ順位ラベル（FIFA 表記: 1F = F組1位, 2A = A組2位, 3B = B組3位） */
export function resolveWcTeamQualLabel(
  teamId: string,
  advancement: WcKnockoutAdvancement
): string {
  const id = teamId.trim();
  if (!id) return "";

  for (const group of Object.keys(advancement.groupWinners) as WcGroupCode[]) {
    if (advancement.groupWinners[group] === id) return `1${group}`;
  }
  for (const group of Object.keys(advancement.groupRunnersUp) as WcGroupCode[]) {
    if (advancement.groupRunnersUp[group] === id) return `2${group}`;
  }
  for (const group of Object.keys(advancement.groupThirdPlaces) as WcGroupCode[]) {
    if (advancement.groupThirdPlaces[group] === id) return `3${group}`;
  }

  return "";
}

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

function resolveWcFeederParticipant(
  bracket: WcBracketState,
  feederMatchId: WcKnockoutMatchId,
  advancement: WcKnockoutAdvancement,
  options?: WcResolveParticipantsOptions
): WcResolvedParticipant {
  const preferOfficial = options?.preferOfficialFeeders === true;
  const official =
    options?.officialWinners?.[
      feederMatchId as WcBracketPredictMatchId
    ]?.trim() ?? "";

  if (preferOfficial && official) {
    return {
      teamId: official,
      label:
        resolveWcTeamQualLabel(official, advancement) ||
        `W${feederMatchId.slice(1)}`,
      source: "official",
    };
  }

  const winner =
    bracket[feederMatchId as WcBracketPredictMatchId]?.winner?.trim() ?? "";
  if (winner) {
    return {
      teamId: winner,
      label: resolveWcTeamQualLabel(winner, advancement),
      source: "bracket_pick",
    };
  }
  return {
    teamId: "",
    label: `W${feederMatchId.slice(1)}`,
    source: "bracket_pick",
  };
}

function teamIdFromWinnerFeed(
  bracket: WcBracketState,
  slot: Extract<WcKnockoutFeedSlot, { kind: "winner_feed" }>,
  advancement: WcKnockoutAdvancement,
  options?: WcResolveParticipantsOptions
): WcResolvedParticipant {
  return resolveWcFeederParticipant(
    bracket,
    slot.matchId,
    advancement,
    options
  );
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
  advancement: WcKnockoutAdvancement,
  options?: WcResolveParticipantsOptions
): [WcResolvedParticipant | null, WcResolvedParticipant | null] | null {
  const def = getWcKnockoutMatch(matchId);
  if (!def) return null;

  /** R16 以降 — feedsFrom 順が home / away と一致（M85–M88 → M95/M96 など） */
  if (def.feedsFrom.length === 2) {
    return [
      resolveWcFeederParticipant(
        bracket,
        def.feedsFrom[0],
        advancement,
        options
      ),
      resolveWcFeederParticipant(
        bracket,
        def.feedsFrom[1],
        advancement,
        options
      ),
    ];
  }

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
        return teamIdFromWinnerFeed(bracket, slot, advancement, options);
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

function wcSfWinnerBracketHalf(
  matchId: "M101" | "M102",
  winner: string,
  bracket: WcBracketState
): "left" | "right" | null {
  const w97 = bracket.M97?.winner?.trim() ?? "";
  const w98 = bracket.M98?.winner?.trim() ?? "";
  const w99 = bracket.M99?.winner?.trim() ?? "";
  const w100 = bracket.M100?.winner?.trim() ?? "";

  if (matchId === "M101") {
    if (w97 && winner === w97) return "left";
    if (w98 && winner === w98) return "right";
    return null;
  }

  if (w99 && winner === w99) return "left";
  if (w100 && winner === w100) return "right";
  return null;
}

/**
 * トーナメント表の左右 SF スロットに載せる決勝進出チーム。
 * 左山・右山のどちらから来たかで配置（M101/M102 の試合番号では固定しない）。
 */
export function getWcTreeSfFinalistSlots(bracket: WcBracketState): {
  left: string | null;
  right: string | null;
} {
  const w101 = bracket.M101?.winner?.trim() ?? "";
  const w102 = bracket.M102?.winner?.trim() ?? "";

  const entries: { team: string; half: "left" | "right" }[] = [];

  if (w101) {
    const half = wcSfWinnerBracketHalf("M101", w101, bracket);
    if (half) entries.push({ team: w101, half });
  }
  if (w102) {
    const half = wcSfWinnerBracketHalf("M102", w102, bracket);
    if (half) entries.push({ team: w102, half });
  }

  let left: string | null = null;
  let right: string | null = null;

  for (const entry of entries) {
    if (entry.half === "left" && !left) left = entry.team;
    else if (entry.half === "right" && !right) right = entry.team;
  }

  // 両方同じ山から決勝進出した場合は M101 左・M102 右にフォールバック
  if (w101 && w102 && (!left || !right)) {
    return { left: w101, right: w102 };
  }

  // 片方だけ決まっている場合
  if (w101 && !w102) {
    const half = wcSfWinnerBracketHalf("M101", w101, bracket);
    if (half === "left") return { left: w101, right: null };
    if (half === "right") return { left: null, right: w101 };
    return { left: w101, right: null };
  }
  if (w102 && !w101) {
    const half = wcSfWinnerBracketHalf("M102", w102, bracket);
    if (half === "left") return { left: w102, right: null };
    if (half === "right") return { left: null, right: w102 };
    return { left: null, right: w102 };
  }

  return { left, right };
}

export { WC_KNOCKOUT_BRACKET_STRUCTURE };
