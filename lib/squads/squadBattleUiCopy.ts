/**
 * SQUAD BATTLE 画面用の表示コピー・UI ヘルパー。
 * プレビュー／モックでも本番でも同じ文言を使う。
 */

import type { Squad } from "@/lib/squads/squadBattleMock";
import {
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_MIN_MEMBERS,
  countActiveMembers,
} from "@/lib/squads/squadBattleMock";

/** 開催サイクル上の現在フェーズ（休止含む） */
export type SquadBattleUiPhase = "entry" | "battle" | "reward" | "idle";

/** 週間ランキングの週インデックス（1〜4） */
export type SquadBattleWeekIndex = 1 | 2 | 3 | 4;

export const SQUAD_BATTLE_WEEK_OPTIONS: readonly {
  index: SquadBattleWeekIndex;
  label: string;
  periodLabel: string;
}[] = [
  { index: 1, label: "W1", periodLabel: "第1週 · 開催 1〜7日" },
  { index: 2, label: "W2", periodLabel: "第2週 · 開催 8〜14日" },
  { index: 3, label: "W3", periodLabel: "第3週 · 開催 15〜21日" },
  { index: 4, label: "W4", periodLabel: "第4週 · 開催 22〜28日" },
] as const;

export const SQUAD_BATTLE_UI_PHASE_OPTIONS: readonly {
  id: SquadBattleUiPhase;
  label: string;
}[] = [
  { id: "entry", label: "ENTRY" },
  { id: "battle", label: "BATTLE" },
  { id: "reward", label: "REWARD" },
  { id: "idle", label: "休止" },
] as const;

/**
 * イントロ下部の補足（フェーズ説明と重複しないこと）。
 * 報酬の同額配布・入れ替え不可は ENTRY / REWARD 側で伝える。
 */
export const SQUAD_BATTLE_INTRO_NOTICES: readonly string[] = [
  "同点は同順位。不正は失格。配布は Free / Pro 共通。",
] as const;

/** LIVE / FINAL の短い説明 */
export const SQUAD_BATTLE_BOARD_STATUS_HINT = {
  live: "暫定順位。集計と不正確認の完了後に FINAL へ切り替わります",
  final: "最終確定済み。この順位で Unit を配布します",
} as const;

export type SquadBattlePhaseBanner = {
  kicker: string;
  title: string;
  detail: string;
  tone: "entry" | "battle" | "reward" | "idle" | "warn";
};

/** フェーズ帯の下に出す状況バナー */
export function squadBattlePhaseBanner(args: {
  phase: SquadBattleUiPhase;
  activeMemberCount: number;
  hasSquad: boolean;
  deadlineLabel?: string | null;
}): SquadBattlePhaseBanner {
  const { phase, activeMemberCount, hasSquad, deadlineLabel } = args;
  const deadline = deadlineLabel?.trim() || null;

  if (phase === "idle") {
    return {
      kicker: "OFF SEASON",
      title: "開催休止中",
      detail: "次回募集の告知までお待ちください。過去スクワッドからの再招集は次回 ENTRY から。",
      tone: "idle",
    };
  }

  if (phase === "entry") {
    if (!hasSquad) {
      return {
        kicker: "ENTRY",
        title: deadline ? `募集締切 ${deadline}` : "スクワッド募集中",
        detail: `${SQUAD_BATTLE_MIN_MEMBERS}〜${SQUAD_BATTLE_MAX_MEMBERS}人で確定。締切時点で${SQUAD_BATTLE_MIN_MEMBERS}人未満は不参加。`,
        tone: "entry",
      };
    }
    if (activeMemberCount < SQUAD_BATTLE_MIN_MEMBERS) {
      return {
        kicker: "ENTRY",
        title: `あと ${SQUAD_BATTLE_MIN_MEMBERS - activeMemberCount} 人必要`,
        detail: deadline
          ? `締切 ${deadline}。${SQUAD_BATTLE_MIN_MEMBERS}人未満だとエントリー失敗になります。`
          : `${SQUAD_BATTLE_MIN_MEMBERS}人未満だとエントリー失敗になります。`,
        tone: "warn",
      };
    }
    if (activeMemberCount < SQUAD_BATTLE_MAX_MEMBERS) {
      return {
        kicker: "ENTRY",
        title: deadline ? `募集締切 ${deadline}` : "メンバー募集中",
        detail: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · 最低人数は満たしています。満員または締切で確定。`,
        tone: "entry",
      };
    }
    return {
      kicker: "ENTRY",
      title: "メンバー確定 · 待機中",
      detail: "満員のため入れ替え不可。開催開始までお待ちください。",
      tone: "entry",
    };
  }

  if (phase === "battle") {
    return {
      kicker: "BATTLE",
      title: hasSquad ? "対戦中 · メンバー LOCKED" : "観戦モード",
      detail: hasSquad
        ? "開始後の入れ替えは不可。週間×4 + 月間で平均スコアを競います。"
        : "未参加でも順位表は閲覧できます。参加は次回 ENTRY から。",
      tone: "battle",
    };
  }

  return {
    kicker: "REWARD",
    title: "結果確定 · Unit 配布",
    detail: "週間・月間の上位グループ確定メンバー全員へ同額 Unit を付与します。",
    tone: "reward",
  };
}

/** エントリーカード用ステータスチップ */
export function squadBattleEntryStatusChip(args: {
  phase: SquadBattleUiPhase;
  myRank?: number | null;
  deadlineLabel?: string | null;
}): { label: string; tone: "entry" | "battle" | "reward" | "idle" } {
  const { phase, myRank, deadlineLabel } = args;
  if (phase === "idle") return { label: "休止", tone: "idle" };
  if (phase === "reward") return { label: "結果発表", tone: "reward" };
  if (phase === "entry") {
    return {
      label: deadlineLabel ? `締切 ${deadlineLabel}` : "募集中",
      tone: "entry",
    };
  }
  if (myRank != null && myRank > 0) {
    return { label: `#${myRank}`, tone: "battle" };
  }
  return { label: "BATTLE", tone: "battle" };
}

/** 前後グループとのスコア差（自分より上の直後 / 下の直後） */
export function squadScoreGaps(
  squad: Pick<Squad, "id" | "avgPoints" | "rank">,
  board: Array<Pick<Squad, "id" | "avgPoints" | "rank">>
): { gapToAbove: number | null; gapToBelow: number | null } {
  const above = board
    .filter((s) => s.rank === squad.rank - 1)
    .sort((a, b) => b.avgPoints - a.avgPoints)[0];
  const below = board
    .filter((s) => s.rank === squad.rank + 1)
    .sort((a, b) => b.avgPoints - a.avgPoints)[0];
  return {
    gapToAbove:
      above == null
        ? null
        : Math.max(0, Math.round(above.avgPoints - squad.avgPoints)),
    gapToBelow:
      below == null
        ? null
        : Math.max(0, Math.round(squad.avgPoints - below.avgPoints)),
  };
}

export function squadMemberCountLabel(squad: Squad): string {
  return `${countActiveMembers(squad)}/${SQUAD_BATTLE_MAX_MEMBERS}`;
}

/** 報酬結果プレビュー用 */
export type SquadBattleRewardResultMock = {
  weeklyRank: number | null;
  monthlyRank: number | null;
  weeklyUnits: number;
  monthlyUnits: number;
  payoutNote: string;
};

export const SQUAD_BATTLE_REWARD_RESULT_MOCK: SquadBattleRewardResultMock = {
  weeklyRank: 3,
  monthlyRank: 5,
  weeklyUnits: 120,
  monthlyUnits: 80,
  payoutNote: "確定メンバー全員へ同額付与 · 反映まで最大24時間",
};

/** プレビュー既定の締切ラベル */
export const SQUAD_BATTLE_MOCK_DEADLINE_LABEL = "8/10 23:59";
