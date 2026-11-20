/**
 * トレード予想バレット — 採点（確定）。
 *
 * 1 枠 100 点満点。総合は 7 枠の合計（700 点満点）。
 *   選手当たり 40
 *   行き先チーム +30
 *   少数派ボーナス（締切時点の投票率・選手当たり時のみ）
 *     50% 以上 → +0
 *     25% 以上〜50% 未満 → +5
 *     10% 以上〜25% 未満 → +10
 *     3% 以上〜10% 未満 → +20
 *     3% 未満 → +30
 *
 * 同点: 総合 → チーム当て数 → 選手当て数 → 最終提出が早い順
 */
import {
  TRADE_BALLOT_SLOT_COUNT,
  type NbaTradeBallotPick,
  type NbaTradeBallotPrediction,
} from "@/lib/predict/nbaTradeBallotPredict";

export const TRADE_BALLOT_SCORE = {
  playerHit: 40,
  teamHitBonus: 30,
  rarity: {
    chalk: 0, // ≥50%
    softChalk: 5, // ≥25% & <50%
    common: 10, // ≥10% & <25%
    uncommon: 20, // ≥3% & <10%
    rare: 30, // <3%
  },
  slotMax: 100,
  /** 7 × 100 */
  totalMax: 700,
} as const;

/** 投票率（0–100）→ 少数派ボーナス */
export function tradeBallotRarityBonus(votePct: number): number {
  const p = Number.isFinite(votePct) ? Math.max(0, votePct) : 0;
  if (p >= 50) return TRADE_BALLOT_SCORE.rarity.chalk;
  if (p >= 25) return TRADE_BALLOT_SCORE.rarity.softChalk;
  if (p >= 10) return TRADE_BALLOT_SCORE.rarity.common;
  if (p >= 3) return TRADE_BALLOT_SCORE.rarity.uncommon;
  return TRADE_BALLOT_SCORE.rarity.rare;
}

export type NbaTradeBallotOfficialTrade = {
  playerId: string;
  /** 受付期間内に最初に移籍したときの移籍先（三角トレードは選手が最終的に入ったチーム）。`tradeBallotOfficialTradesFromConfirmed` で作る */
  toTeamId: string;
};

export type NbaTradeBallotSlotScore = {
  index: number;
  playerId: string | null;
  toTeamId: string | null;
  playerHit: boolean;
  teamHit: boolean;
  votePct: number | null;
  rarityBonus: number;
  points: number;
};

export type NbaTradeBallotScoreResult = {
  slots: NbaTradeBallotSlotScore[];
  /** 7 枠の合計（0–700） */
  total: number;
  playerHits: number;
  teamHits: number;
};

/**
 * @param votePctByPlayerId 締切時点の「その選手をバレットに入れた提出」の割合（0–100）
 */
export function scoreTradeBallotPrediction(
  prediction: NbaTradeBallotPrediction,
  officialTrades: readonly NbaTradeBallotOfficialTrade[],
  votePctByPlayerId: Readonly<Record<string, number>>
): NbaTradeBallotScoreResult {
  const byPlayer = new Map(
    officialTrades.map((t) => [t.playerId.trim(), t] as const)
  );

  const slots: NbaTradeBallotSlotScore[] = [];
  for (let i = 0; i < TRADE_BALLOT_SLOT_COUNT; i += 1) {
    const pick: NbaTradeBallotPick = prediction.picks[i] ?? {
      playerId: null,
      toTeamId: null,
    };
    const playerId =
      typeof pick.playerId === "string" && pick.playerId.trim()
        ? pick.playerId.trim()
        : null;
    const toTeamId =
      typeof pick.toTeamId === "string" && pick.toTeamId.trim()
        ? pick.toTeamId.trim()
        : null;

    const official = playerId ? byPlayer.get(playerId) : undefined;
    const playerHit = Boolean(official);
    const teamHit = Boolean(
      playerHit &&
        official &&
        toTeamId &&
        official.toTeamId.trim() === toTeamId
    );

    const rawVote =
      playerHit && playerId != null ? votePctByPlayerId[playerId] : undefined;
    const votePct =
      typeof rawVote === "number" && Number.isFinite(rawVote) ? rawVote : null;
    // 投票率欠損時は本命扱い（上乗せなし）— 集計前に採点しない前提
    const rarityBonus = playerHit
      ? tradeBallotRarityBonus(votePct ?? 100)
      : 0;

    let points = 0;
    if (playerHit) {
      points += TRADE_BALLOT_SCORE.playerHit;
      if (teamHit) points += TRADE_BALLOT_SCORE.teamHitBonus;
      points += rarityBonus;
    }

    slots.push({
      index: i,
      playerId,
      toTeamId,
      playerHit,
      teamHit,
      votePct: votePct != null && Number.isFinite(votePct) ? votePct : null,
      rarityBonus: playerHit ? rarityBonus : 0,
      points: Math.min(TRADE_BALLOT_SCORE.slotMax, points),
    });
  }

  const total = slots.reduce((a, s) => a + s.points, 0);
  return {
    slots,
    total,
    playerHits: slots.filter((s) => s.playerHit).length,
    teamHits: slots.filter((s) => s.teamHit).length,
  };
}

export type NbaTradeBallotRankRow = {
  total: number;
  teamHits: number;
  playerHits: number;
  /** 最終提出時刻（早いほど上） */
  submittedAtMs: number;
};

/** ランキング比較: 負なら a が上 */
export function compareTradeBallotRankRows(
  a: NbaTradeBallotRankRow,
  b: NbaTradeBallotRankRow
): number {
  if (a.total !== b.total) return b.total - a.total;
  if (a.teamHits !== b.teamHits) return b.teamHits - a.teamHits;
  if (a.playerHits !== b.playerHits) return b.playerHits - a.playerHits;
  return a.submittedAtMs - b.submittedAtMs;
}
