/**
 * WC 2026 ノックアウトステージ — ブラケットツリー定義（Phase 1）
 *
 * FIFA 公式の試合番号 M73–M104 に準拠。
 * ブラケット予想は M73–M102 + M104（31 試合）。M103 は 3 位決定戦（予想対象外）。
 *
 * @see https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
 */

import type { WcGroupCode } from "@/lib/wc/groups";

/** FIFA 試合番号（M73 = Round of 32 第 1 試合） */
export type WcKnockoutMatchId =
  | "M73"
  | "M74"
  | "M75"
  | "M76"
  | "M77"
  | "M78"
  | "M79"
  | "M80"
  | "M81"
  | "M82"
  | "M83"
  | "M84"
  | "M85"
  | "M86"
  | "M87"
  | "M88"
  | "M89"
  | "M90"
  | "M91"
  | "M92"
  | "M93"
  | "M94"
  | "M95"
  | "M96"
  | "M97"
  | "M98"
  | "M99"
  | "M100"
  | "M101"
  | "M102"
  | "M103"
  | "M104";

export type WcKnockoutRound = "R32" | "R16" | "QF" | "SF" | "FINAL" | "THIRD";

/** ブラケット予想の対象試合（3 位決定戦を除く 31 試合） */
export type WcBracketPredictMatchId = Exclude<WcKnockoutMatchId, "M103">;

export const WC_KNOCKOUT_SEASON = "2025-26";

export const WC_BRACKET_PREDICT_MATCH_IDS: readonly WcBracketPredictMatchId[] = [
  "M73",
  "M74",
  "M75",
  "M76",
  "M77",
  "M78",
  "M79",
  "M80",
  "M81",
  "M82",
  "M83",
  "M84",
  "M85",
  "M86",
  "M87",
  "M88",
  "M89",
  "M90",
  "M91",
  "M92",
  "M93",
  "M94",
  "M95",
  "M96",
  "M97",
  "M98",
  "M99",
  "M100",
  "M101",
  "M102",
  "M104",
] as const;

export type WcKnockoutSlotKind =
  | "group_winner"
  | "group_runner_up"
  | "best_third"
  | "winner_feed";

export type WcKnockoutFeedSlot =
  | {
      kind: "group_winner" | "group_runner_up";
      group: WcGroupCode;
      /** 表示ラベル例: "1E", "2A" */
      label: string;
    }
  | {
      kind: "best_third";
      /** 候補グループ（FIFA 事前定義プール） */
      candidateGroups: readonly WcGroupCode[];
      /** 表示ラベル例: "3ABCDEF" */
      label: string;
    }
  | {
      kind: "winner_feed";
      matchId: WcKnockoutMatchId;
      label: string;
    };

export type WcKnockoutMatchDef = {
  id: WcKnockoutMatchId;
  round: WcKnockoutRound;
  /** 親試合（R32 は空） */
  feedsFrom: readonly WcKnockoutMatchId[];
  home: WcKnockoutFeedSlot;
  away: WcKnockoutFeedSlot;
  /** モバイル縦ブラケット用。R32 のみ使用 */
  display?: {
    half: "left" | "right";
    /** 半分内の上から 0–7 */
    r32Index: number;
  };
};

const gw = (group: WcGroupCode): WcKnockoutFeedSlot => ({
  kind: "group_winner",
  group,
  label: `1${group}`,
});

const gr = (group: WcGroupCode): WcKnockoutFeedSlot => ({
  kind: "group_runner_up",
  group,
  label: `2${group}`,
});

const t3 = (
  candidateGroups: readonly WcGroupCode[],
  label: string
): WcKnockoutFeedSlot => ({
  kind: "best_third",
  candidateGroups,
  label,
});

const wf = (matchId: WcKnockoutMatchId): WcKnockoutFeedSlot => ({
  kind: "winner_feed",
  matchId,
  label: `W${matchId.slice(1)}`,
});

/**
 * FIFA 2026 ノックアウト全試合。
 * R32 の display.r32Index は左/右 8 試合を上から並べた描画順（縦画面ブラケット用）。
 */
export const WC_KNOCKOUT_MATCHES: readonly WcKnockoutMatchDef[] = [
  // —— Round of 32 ——
  {
    id: "M73",
    round: "R32",
    feedsFrom: [],
    home: gr("A"),
    away: gr("B"),
    display: { half: "left", r32Index: 2 },
  },
  {
    id: "M74",
    round: "R32",
    feedsFrom: [],
    home: gw("E"),
    away: t3(["A", "B", "C", "D", "F"], "3ABCDF"),
    display: { half: "left", r32Index: 0 },
  },
  {
    id: "M75",
    round: "R32",
    feedsFrom: [],
    home: gw("F"),
    away: gr("C"),
    display: { half: "left", r32Index: 3 },
  },
  {
    id: "M76",
    round: "R32",
    feedsFrom: [],
    home: gw("C"),
    away: gr("F"),
    display: { half: "left", r32Index: 4 },
  },
  {
    id: "M77",
    round: "R32",
    feedsFrom: [],
    home: gw("I"),
    away: t3(["C", "D", "F", "G", "H"], "3CDFGH"),
    display: { half: "left", r32Index: 1 },
  },
  {
    id: "M78",
    round: "R32",
    feedsFrom: [],
    home: gr("E"),
    away: gr("I"),
    display: { half: "left", r32Index: 5 },
  },
  {
    id: "M79",
    round: "R32",
    feedsFrom: [],
    home: gw("A"),
    away: t3(["C", "E", "F", "H", "I"], "3CEFHI"),
    display: { half: "left", r32Index: 6 },
  },
  {
    id: "M80",
    round: "R32",
    feedsFrom: [],
    home: gw("L"),
    away: t3(["E", "H", "I", "J", "K"], "3EHIJK"),
    display: { half: "left", r32Index: 7 },
  },
  {
    id: "M81",
    round: "R32",
    feedsFrom: [],
    home: gw("D"),
    away: t3(["B", "E", "F", "I", "J"], "3BEFIJ"),
    display: { half: "right", r32Index: 0 },
  },
  {
    id: "M82",
    round: "R32",
    feedsFrom: [],
    home: gw("G"),
    away: t3(["A", "E", "H", "I", "J"], "3AEHIJ"),
    display: { half: "right", r32Index: 1 },
  },
  {
    id: "M83",
    round: "R32",
    feedsFrom: [],
    home: gr("K"),
    away: gr("L"),
    display: { half: "right", r32Index: 2 },
  },
  {
    id: "M84",
    round: "R32",
    feedsFrom: [],
    home: gw("H"),
    away: gr("J"),
    display: { half: "right", r32Index: 3 },
  },
  {
    id: "M85",
    round: "R32",
    feedsFrom: [],
    home: gw("B"),
    away: t3(["E", "F", "G", "I", "J"], "3EFGIJ"),
    display: { half: "right", r32Index: 4 },
  },
  {
    id: "M86",
    round: "R32",
    feedsFrom: [],
    home: gw("J"),
    away: gr("H"),
    // r32Index 6 — M87 より下。M95(M86×M88) のペア用（85/87 は隣接させる）
    display: { half: "right", r32Index: 6 },
  },
  {
    id: "M87",
    round: "R32",
    feedsFrom: [],
    home: gw("K"),
    away: t3(["D", "E", "I", "J", "L"], "3DEIJL"),
    // r32Index 5 — M85 の直下。M96(M85×M87) のペア用
    display: { half: "right", r32Index: 5 },
  },
  {
    id: "M88",
    round: "R32",
    feedsFrom: [],
    home: gr("D"),
    away: gr("G"),
    display: { half: "right", r32Index: 7 },
  },

  // —— Round of 16 ——
  {
    id: "M89",
    round: "R16",
    feedsFrom: ["M74", "M77"],
    home: wf("M74"),
    away: wf("M77"),
  },
  {
    id: "M90",
    round: "R16",
    feedsFrom: ["M73", "M75"],
    home: wf("M73"),
    away: wf("M75"),
  },
  {
    id: "M91",
    round: "R16",
    feedsFrom: ["M76", "M78"],
    home: wf("M76"),
    away: wf("M78"),
  },
  {
    id: "M92",
    round: "R16",
    feedsFrom: ["M79", "M80"],
    home: wf("M79"),
    away: wf("M80"),
  },
  {
    id: "M93",
    round: "R16",
    feedsFrom: ["M83", "M84"],
    home: wf("M83"),
    away: wf("M84"),
  },
  {
    id: "M94",
    round: "R16",
    feedsFrom: ["M81", "M82"],
    home: wf("M81"),
    away: wf("M82"),
  },
  {
    id: "M95",
    round: "R16",
    feedsFrom: ["M86", "M88"],
    home: wf("M86"),
    away: wf("M88"),
  },
  {
    id: "M96",
    round: "R16",
    feedsFrom: ["M85", "M87"],
    home: wf("M85"),
    away: wf("M87"),
  },

  // —— Quarter-finals ——
  {
    id: "M97",
    round: "QF",
    feedsFrom: ["M89", "M90"],
    home: wf("M89"),
    away: wf("M90"),
  },
  {
    id: "M98",
    round: "QF",
    feedsFrom: ["M93", "M94"],
    home: wf("M93"),
    away: wf("M94"),
  },
  {
    id: "M99",
    round: "QF",
    feedsFrom: ["M91", "M92"],
    home: wf("M91"),
    away: wf("M92"),
  },
  {
    id: "M100",
    round: "QF",
    feedsFrom: ["M95", "M96"],
    home: wf("M95"),
    away: wf("M96"),
  },

  // —— Semi-finals ——
  {
    id: "M101",
    round: "SF",
    feedsFrom: ["M97", "M98"],
    home: wf("M97"),
    away: wf("M98"),
  },
  {
    id: "M102",
    round: "SF",
    feedsFrom: ["M99", "M100"],
    home: wf("M99"),
    away: wf("M100"),
  },

  // —— Third place (prediction excluded) ——
  {
    id: "M103",
    round: "THIRD",
    feedsFrom: ["M101", "M102"],
    home: { kind: "winner_feed", matchId: "M101", label: "RU101" },
    away: { kind: "winner_feed", matchId: "M102", label: "RU102" },
  },

  // —— Final ——
  {
    id: "M104",
    round: "FINAL",
    feedsFrom: ["M101", "M102"],
    home: wf("M101"),
    away: wf("M102"),
  },
] as const;

/** child → parent feeds（NBA の PLAYOFF_BRACKET_STRUCTURE 相当） */
export const WC_KNOCKOUT_BRACKET_STRUCTURE: Readonly<
  Record<WcKnockoutMatchId, readonly WcKnockoutMatchId[]>
> = Object.fromEntries(
  WC_KNOCKOUT_MATCHES.map((m) => [m.id, m.feedsFrom])
) as Record<WcKnockoutMatchId, readonly WcKnockoutMatchId[]>;

const MATCH_BY_ID = new Map(
  WC_KNOCKOUT_MATCHES.map((m) => [m.id, m] as const)
);

export type WcBracketPick = {
  winner: string;
};

export type WcBracketState = Partial<
  Record<WcBracketPredictMatchId, WcBracketPick>
>;

/** survivor 評価の試合順（R32 → Final） */
export const WC_KNOCKOUT_MATCH_ORDER: readonly WcBracketPredictMatchId[] =
  WC_BRACKET_PREDICT_MATCH_IDS;

export function getWcKnockoutMatch(
  id: WcKnockoutMatchId
): WcKnockoutMatchDef | undefined {
  return MATCH_BY_ID.get(id);
}

export function getWcKnockoutRound(
  id: WcKnockoutMatchId
): WcKnockoutRound | undefined {
  return MATCH_BY_ID.get(id)?.round;
}

export function getWcKnockoutParentMatches(
  id: WcKnockoutMatchId
): readonly WcKnockoutMatchId[] {
  return WC_KNOCKOUT_BRACKET_STRUCTURE[id] ?? [];
}

export function listWcKnockoutMatchesByRound(
  round: WcKnockoutRound
): WcKnockoutMatchDef[] {
  return WC_KNOCKOUT_MATCHES.filter((m) => m.round === round);
}

export function listWcR32MatchesForDisplay(
  half: "left" | "right"
): WcKnockoutMatchDef[] {
  return WC_KNOCKOUT_MATCHES.filter(
    (m) => m.round === "R32" && m.display?.half === half
  ).sort((a, b) => (a.display!.r32Index - b.display!.r32Index));
}

export function isWcBracketPredictMatchId(
  id: string
): id is WcBracketPredictMatchId {
  return (WC_BRACKET_PREDICT_MATCH_IDS as readonly string[]).includes(id);
}

export function isWcBracketComplete(bracket: WcBracketState): boolean {
  for (const id of WC_BRACKET_PREDICT_MATCH_IDS) {
    const pick = bracket[id];
    if (!pick?.winner?.trim()) return false;
  }
  return true;
}

export function getWcBracketChampionPick(
  bracket: WcBracketState
): string | null {
  const w = bracket.M104?.winner?.trim();
  return w || null;
}

/** ラウンド通算の survivor 深度（R32 全勝=5, Final まで=5） */
export function survivedRoundsFromFirstMiss(
  firstMissMatchId: WcBracketPredictMatchId | null
): number {
  if (!firstMissMatchId) return 5;
  const idx = WC_KNOCKOUT_MATCH_ORDER.indexOf(firstMissMatchId);
  if (idx < 0) return 0;
  const round = getWcKnockoutRound(firstMissMatchId);
  const depthByRound: Record<WcKnockoutRound, number> = {
    R32: 0,
    R16: 1,
    QF: 2,
    SF: 3,
    FINAL: 4,
    THIRD: 0,
  };
  return depthByRound[round ?? "R32"] ?? 0;
}
