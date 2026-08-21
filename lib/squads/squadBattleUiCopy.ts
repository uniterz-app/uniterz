/**
 * SQUAD BATTLE 画面用の表示コピー・UI ヘルパー。
 * プレビュー／モックでも本番でも同じ文言を使う。
 */

import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonShortLabel,
} from "@/lib/rankings/nbaSeason";
import type { Squad } from "@/lib/squads/squadBattleMock";
import { estimatedGroupBattleUnitsPerMember } from "@/lib/groupBattles/unitLedger";
import {
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_MIN_MEMBERS,
  countActiveMembers,
} from "@/lib/squads/squadBattleMock";

/** 開催サイクル上の現在フェーズ（休止含む） */
export type SquadBattleUiPhase = "entry" | "battle" | "reward" | "idle";

/** 大会ドキュメントの phase → JOIN/RANK の UI フェーズ */
export function groupBattlePhaseToUiPhase(
  phase: string | null | undefined
): SquadBattleUiPhase {
  switch (phase) {
    case "announced":
    case "recruiting":
    case "locking":
      return "entry";
    case "battle":
      return "battle";
    case "settling":
    case "final":
      return "reward";
    case "closed":
    default:
      return "idle";
  }
}

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
  "対象は Pick Up 試合のみ。同点は同順位。不正は失格。配布は Free / Pro 共通。",
] as const;

/** LIVE / FINAL の短い説明 */
export const SQUAD_BATTLE_BOARD_STATUS_HINT = {
  live: "暫定順位。集計と不正確認の完了後に FINAL へ切り替わります",
  final: "最終確定済み。この順位で Unit を配布します",
} as const;

/** 休止パネル（JOIN / RANK）— フェーズバナーと二重に出さない。ルールはここに集約 */
export const SQUAD_BATTLE_IDLE_PANEL = {
  kicker: "Off season",
  title: "NEXT ENTRY SOON",
  detail:
    "次回 ENTRY の告知までお待ちください。再招集もそのときから。",
} as const;

/** オフシーズン下のルール見出し + 箇条書き（長文ヘルプの要約） */
export const SQUAD_BATTLE_RULES_SECTION = {
  title: "ルール",
  items: [
    "3〜5人のスクワッドで、Pick Up 試合の平均スコアを競う",
    "1大会につき所属できるグループは1つまで",
    "空き枠への申請・承認、または招待コードで参加",
    "同時申請は最大3件。メンバー確定後は入れ替え不可",
    "約2ヶ月に1回。募集1〜2週間 → バトル約1ヶ月",
    "週間×4 + 月間で順位。同点は同順位・同 Unit",
    "週間1位は全員30 Unit、月間1位は全員100 Unit（上位20まで）",
    "過去スクワッドから同じ顔ぶれを再招集できる",
  ],
} as const;

/** RANK · 未所属時のヒント（ピン留めの内部用語は使わない） */
export const SQUAD_BATTLE_RANK_SPECTATOR_HINT =
  "自分のスクワッドはありません。順位表は観戦できます。参加は JOIN（ENTRY）から。";

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
      title: "次回募集待ち",
      detail: "次回 ENTRY の告知までお待ちください。再招集もそのときから。",
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
        ? "開始後の入れ替えは不可。Pick Up 試合の週間×4 + 月間で平均スコアを競います。"
        : "未参加でも順位表は閲覧できます。参加は次回 ENTRY から。",
      tone: "battle",
    };
  }

  return {
    kicker: "REWARD",
    title: "結果確定 · Unit 配布",
    detail:
      "週間1位はメンバー全員に 30 Unit、月間1位は 100 Unit。上位20グループまで順位に応じた Unit を確定メンバー全員へ同額付与します。",
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

/** RANK リストに出す上位組数（ピン留め MY SQUAD は別） */
export const SQUAD_RANKING_LIST_LIMIT = 20;

export function squadRankingList<T>(rows: T[]): T[] {
  return rows.slice(0, SQUAD_RANKING_LIST_LIMIT);
}

/**
 * リストカード右辺 DETAIL タブ（リザルトカードと同型）。
 * スクワッド行はリザルトより低いので top を上げてカードに載せる。
 */
export const SQUAD_RANKING_DETAIL_SPINE = {
  width: 10,
  height: 72,
  top: 10,
} as const;

/** 募集中メンバーの個人順位（バトル未開始のためスコアの代わり） */
export const SQUAD_OPEN_PERIOD_RANK_GROUP_LABEL = "順位";

export const SQUAD_OPEN_PERIOD_RANKS = [
  { key: "lastMonthRank", label: "先月" },
  { key: "lastWeekRank", label: "先週" },
  { key: "thisWeekRank", label: "今週" },
] as const;

export function formatSquadOpenPeriodRank(
  rank: number | null | undefined
): string {
  if (rank == null || rank <= 0) return "—";
  return String(rank);
}

/** 報酬結果（本番台帳 / プレビュー共通） */
export type SquadBattleWeeklyPayoutLine = {
  weekIndex: SquadBattleWeekIndex;
  rank: number | null;
  units: number;
  status?: "paid" | "pending" | "none";
};

export type SquadBattleRewardResult = {
  weekly: readonly SquadBattleWeeklyPayoutLine[];
  monthlyRank: number | null;
  monthlyUnits: number;
  monthlyStatus?: "paid" | "pending" | "none";
  payoutNote: string;
};

/** @deprecated 名前互換 — SquadBattleRewardResult を使う */
export type SquadBattleWeeklyPayoutMock = SquadBattleWeeklyPayoutLine;
export type SquadBattleRewardResultMock = SquadBattleRewardResult;

function mockWeeklyPayout(
  weekIndex: SquadBattleWeekIndex,
  rank: number
): SquadBattleWeeklyPayoutLine {
  return {
    weekIndex,
    rank,
    units: estimatedGroupBattleUnitsPerMember("weekly", rank) ?? 0,
    status: "paid",
  };
}

export const SQUAD_BATTLE_REWARD_RESULT_MOCK: SquadBattleRewardResult = {
  weekly: [
    mockWeeklyPayout(1, 3),
    mockWeeklyPayout(2, 2),
    mockWeeklyPayout(3, 5),
    mockWeeklyPayout(4, 1),
  ],
  monthlyRank: 5,
  monthlyUnits: estimatedGroupBattleUnitsPerMember("monthly", 5) ?? 0,
  monthlyStatus: "paid",
  payoutNote:
    "確定メンバー全員へ同額付与 · Pick Up 試合のみ · 反映まで最大24時間",
};

export function squadBattlePayoutTotalUnits(
  result: SquadBattleRewardResult
): number {
  const weekly = result.weekly.reduce((sum, w) => sum + w.units, 0);
  return weekly + result.monthlyUnits;
}

/** プレビュー既定の締切ラベル */
export const SQUAD_BATTLE_MOCK_DEADLINE_LABEL = "8/10 23:59";

export function squadInviteSendPrompt(
  displayName: string,
  squadName: string
): string {
  return `${displayName} を ${squadName} に誘いますか？`;
}

export function squadApplicantApprovePrompt(displayName: string): string {
  return `${displayName} を承認しますか？`;
}

export function squadInviteIncomingTitle(fromName: string): string {
  return `${fromName} からスクワッドバトルの招待が来ています`;
}

export const SQUAD_INVITE_HOLD_HINT =
  "保留すると、招待されているスクワッドからいつでも参加できます。";

export const SQUAD_INVITE_LIST_TITLE = "招待されているスクワッド";

export const SQUAD_INVITE_LIST_HINT =
  "招待されたスクワッドです。ここから参加できます。";

export const SQUAD_INVITE_LIST_EMPTY = "届いている招待はありません。";

export const SQUAD_INVITE_JOIN_PROMPT = "このグループに参加しますか";

export const SQUAD_APPLICANT_OPEN_PROFILE = "プロフィールを見る";

/** 申請者カードの Score / 勝率は現行 NBA シーズン累計（今週ではない） */
export const SQUAD_APPLICANT_SEASON_SHORT = nbaSeasonShortLabel(
  CURRENT_NBA_SEASON_KEY
);

export const SQUAD_APPLICANT_SCORE_LABEL = `${SQUAD_APPLICANT_SEASON_SHORT} 累積`;

export const SQUAD_APPLICANT_WINRATE_LABEL = `${SQUAD_APPLICANT_SEASON_SHORT} 勝率`;

export const SQUAD_APPLICANT_WR_LABEL = `${SQUAD_APPLICANT_SEASON_SHORT} WR`;

export const SQUAD_INVITE_DEADLINE_PREFIX = "エントリー期限";

/** 開催告知モーダル（たたき台） */
export const SQUAD_BATTLE_LAUNCH_STORAGE_KEY =
  "uniterz:squad-battle-launch:v1";

export const SQUAD_BATTLE_LAUNCH_KICKER = "NOW OPEN";

export const SQUAD_BATTLE_LAUNCH_TITLE = "SQUAD BATTLE";

export const SQUAD_BATTLE_LAUNCH_LEAD =
  "募集が始まりました。3〜5人のスクワッドで、Pick Up 試合の平均スコアを競う。";

export const SQUAD_BATTLE_LAUNCH_CTA = "参加する";

export const SQUAD_BATTLE_LAUNCH_LATER = "あとで";

export const SQUAD_BATTLE_LAUNCH_FACTS: readonly {
  kicker: string;
  value: string;
}[] = [
  { kicker: "ENTRY", value: "約1〜2週間 · メンバー確定後は入れ替え不可" },
  { kicker: "PICK UP", value: "対象試合のみ" },
  { kicker: "SQUAD", value: "3〜5人" },
  { kicker: "REWARD", value: "週1位 30 · 月1位 100 Unit（全員）" },
] as const;

/** Native DEV / プレビューメニュー — 画面ジャンプ */
export type SquadBattlePreviewJumpOverlay =
  | "intro"
  | "launch"
  | "create"
  | "joinCode"
  | "applicant"
  | "detail";

export const SQUAD_BATTLE_PREVIEW_JUMPS: readonly {
  id: string;
  label: string;
  previewState: "none" | "recruiting" | "full";
  phase: SquadBattleUiPhase;
  tab: "join" | "rank";
  boardStatus?: "live" | "final";
  overlay?: SquadBattlePreviewJumpOverlay;
}[] = [
  {
    id: "join-entry-none",
    label: "JOIN · 未参加",
    previewState: "none",
    phase: "entry",
    tab: "join",
  },
  {
    id: "join-entry-recruit",
    label: "JOIN · 募集中",
    previewState: "recruiting",
    phase: "entry",
    tab: "join",
  },
  {
    id: "join-entry-full",
    label: "JOIN · 満員",
    previewState: "full",
    phase: "entry",
    tab: "join",
  },
  {
    id: "join-battle-watch",
    label: "JOIN · 観戦",
    previewState: "none",
    phase: "battle",
    tab: "join",
  },
  {
    id: "join-reward",
    label: "JOIN · REWARD",
    previewState: "full",
    phase: "reward",
    tab: "join",
  },
  {
    id: "join-idle",
    label: "JOIN · 休止",
    previewState: "none",
    phase: "idle",
    tab: "join",
  },
  {
    id: "rank-live",
    label: "RANK · LIVE",
    previewState: "full",
    phase: "battle",
    tab: "rank",
    boardStatus: "live",
  },
  {
    id: "rank-final",
    label: "RANK · FINAL",
    previewState: "full",
    phase: "battle",
    tab: "rank",
    boardStatus: "final",
  },
  { id: "overlay-intro", label: "イントロ", previewState: "full", phase: "battle", tab: "rank", overlay: "intro" },
  { id: "overlay-launch", label: "開催モーダル", previewState: "none", phase: "entry", tab: "join", overlay: "launch" },
  { id: "overlay-create", label: "作成シート", previewState: "none", phase: "entry", tab: "join", overlay: "create" },
  { id: "overlay-code", label: "招待コード", previewState: "none", phase: "entry", tab: "join", overlay: "joinCode" },
  { id: "overlay-applicant", label: "申請プロフィール", previewState: "recruiting", phase: "entry", tab: "join", overlay: "applicant" },
  { id: "overlay-detail", label: "RANK DETAIL", previewState: "full", phase: "battle", tab: "rank", overlay: "detail" },
] as const;
