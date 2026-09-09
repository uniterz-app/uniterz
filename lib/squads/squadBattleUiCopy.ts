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

/** 表示言語（`users.language` 由来） */
export type SquadBattleUiLang = "ja" | "en";

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

/**
 * JOIN の作成・申請・コード参加など mutate 可能か。
 * サーバー `assertRecruitingOrThrow` と揃える（announced / locking は不可）。
 */
export function canMutateSquadBattleJoinUi(
  phase: string | null | undefined
): boolean {
  return phase === "recruiting";
}

/**
 * 週間チップの初期選択。
 * 今日（JST）までに開始した最後の週。未開始なら W1。
 */
export function resolveSquadBattleWeekIndex(args: {
  weeklyLabels: readonly string[];
  nowMs?: number;
}): SquadBattleWeekIndex {
  const labels = args.weeklyLabels.filter(Boolean);
  if (labels.length === 0) return 1;
  const now = args.nowMs ?? Date.now();
  const jst = new Date(now + 9 * 60 * 60 * 1000);
  const today = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}`;
  let idx = 0;
  for (let i = 0; i < labels.length; i += 1) {
    if (labels[i]! <= today) idx = i;
    else break;
  }
  const oneBased = Math.min(4, Math.max(1, idx + 1));
  return oneBased as SquadBattleWeekIndex;
}

/** 週間ランキングの週インデックス（1〜4） */
export type SquadBattleWeekIndex = 1 | 2 | 3 | 4;

/** 週チップの既定ラベル（大会 weeklyLabels 未取得時） */
export function squadBattleWeekOptions(
  lang: SquadBattleUiLang = "ja"
): ReadonlyArray<{
  index: SquadBattleWeekIndex;
  label: string;
  periodLabel: string;
}> {
  if (lang === "en") {
    return [
      { index: 1, label: "W1", periodLabel: "Week 1 · Days 1–7" },
      { index: 2, label: "W2", periodLabel: "Week 2 · Days 8–14" },
      { index: 3, label: "W3", periodLabel: "Week 3 · Days 15–21" },
      { index: 4, label: "W4", periodLabel: "Week 4 · Days 22–28" },
    ];
  }
  return [
    { index: 1, label: "W1", periodLabel: "第1週 · 開催 1〜7日" },
    { index: 2, label: "W2", periodLabel: "第2週 · 開催 8〜14日" },
    { index: 3, label: "W3", periodLabel: "第3週 · 開催 15〜21日" },
    { index: 4, label: "W4", periodLabel: "第4週 · 開催 22〜28日" },
  ];
}

/** 大会の weeklyLabels 本数に合わせた週チップ（最大4） */
export function squadBattleWeekChipOptions(
  weeklyLabels: readonly string[],
  lang: SquadBattleUiLang = "ja"
): Array<{
  index: SquadBattleWeekIndex;
  label: string;
  periodLabel: string;
}> {
  const count = Math.min(
    4,
    Math.max(1, weeklyLabels.length > 0 ? weeklyLabels.length : 4)
  );
  return squadBattleWeekOptions(lang)
    .slice(0, count)
    .map((w, i) => {
      const monday = weeklyLabels[i];
      return {
        index: w.index,
        label: w.label,
        periodLabel: monday
          ? `${w.label} · ${formatWeekChipRange(monday, lang)}`
          : w.periodLabel,
      };
    });
}

function formatWeekChipRange(
  mondayKey: string,
  lang: SquadBattleUiLang = "ja"
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mondayKey)) return mondayKey;
  const [y, m, d] = mondayKey.split("-").map(Number);
  const start = new Date(Date.UTC(y!, m! - 1, d!));
  const end = new Date(Date.UTC(y!, m! - 1, d! + 6));
  const fmt = (dt: Date) =>
    `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  return lang === "en"
    ? `${fmt(start)} – ${fmt(end)}`
    : `${fmt(start)}〜${fmt(end)}`;
}

/** LIVE / FINAL の短い説明 */
export function squadBattleBoardStatusHint(
  lang: SquadBattleUiLang = "ja"
): { live: string; final: string } {
  if (lang === "en") {
    return {
      live: "Provisional. Usually refreshed around 16:00 / 23:30 JST. Turns FINAL once confirmed",
      final: "Confirmed. Units are paid out on these standings",
    };
  }
  return {
    live: "暫定順位。原則 16:00 / 23:30 JST 前後に更新。確定後に FINAL へ",
    final: "最終確定済み。この順位で Unit を配布します",
  };
}

/** RANK ボードの最終集計時刻（JST） */
export function formatSquadBattleBoardBuiltAt(
  builtAtMs: number | null | undefined,
  lang: SquadBattleUiLang = "ja"
): string | null {
  const ms = Number(builtAtMs);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  try {
    return new Date(ms).toLocaleString(lang === "en" ? "en-US" : "ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

/** DEV プレビューのフェーズ切替チップ */
export function squadBattleUiPhaseOptions(
  lang: SquadBattleUiLang = "ja"
): ReadonlyArray<{ id: SquadBattleUiPhase; label: string }> {
  return [
    { id: "entry", label: "ENTRY" },
    { id: "battle", label: "BATTLE" },
    { id: "reward", label: "REWARD" },
    { id: "idle", label: lang === "en" ? "OFF" : "休止" },
  ];
}

/**
 * イントロ下部の補足（フェーズ説明と重複しないこと）。
 * 報酬の同額配布・入れ替え不可は ENTRY / REWARD 側で伝える。
 */
export function squadBattleIntroNotices(
  lang: SquadBattleUiLang = "ja"
): readonly string[] {
  return lang === "en"
    ? [
        "Pick Up games only. Ties share the rank. Cheating means disqualification. Payouts are the same for Free and Pro.",
      ]
    : [
        "対象は Pick Up 試合のみ。同点は同順位。不正は失格。配布は Free / Pro 共通。",
      ];
}

/** 休止パネル（JOIN / RANK）— フェーズバナーと二重に出さない。ルールはここに集約 */
export function squadBattleIdlePanel(lang: SquadBattleUiLang = "ja"): {
  kicker: string;
  title: string;
  detail: string;
} {
  if (lang === "en") {
    return {
      kicker: "Off season",
      title: "NEXT ENTRY SOON",
      detail:
        "Hold tight until the next ENTRY is announced. Re-forming opens then too.",
    };
  }
  return {
    kicker: "Off season",
    title: "NEXT ENTRY SOON",
    detail: "次回 ENTRY の告知までお待ちください。再招集もそのときから。",
  };
}

/** オフシーズン下のルール見出し + 箇条書き（長文ヘルプの要約） */
export function squadBattleRulesSection(lang: SquadBattleUiLang = "ja"): {
  title: string;
  items: readonly string[];
} {
  if (lang === "en") {
    return {
      title: "Rules",
      items: [
        "Squads of 3–5 compete on average score in Pick Up games",
        "One squad per battle",
        "Join by applying to an open slot, or with an invite code",
        "Up to 3 applications at once. No swaps once members are locked",
        "Runs roughly every 2 months. 1–2 weeks recruiting → about 1 month of battle",
        "4 weekly boards + 1 monthly. Ties share the rank and the Units",
        "Weekly 1st pays 30 Units each, monthly 1st pays 100 each (top 20 paid)",
        "You can re-form the same lineup from a past squad",
      ],
    };
  }
  return {
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
  };
}

/** RANK · 未所属時のヒント（ピン留めの内部用語は使わない） */
export function squadBattleRankSpectatorHint(
  lang: SquadBattleUiLang = "ja"
): string {
  return lang === "en"
    ? "You're not in a squad yet. You can still watch the board — join from the JOIN (ENTRY) tab."
    : "自分のスクワッドはありません。順位表は観戦できます。参加は JOIN（ENTRY）から。";
}

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
  lang?: SquadBattleUiLang;
}): SquadBattlePhaseBanner {
  const { phase, activeMemberCount, hasSquad, deadlineLabel } = args;
  const lang = args.lang ?? "ja";
  const deadline = deadlineLabel?.trim() || null;
  const en = lang === "en";

  if (phase === "idle") {
    return {
      kicker: "OFF SEASON",
      title: en ? "Waiting for the next entry" : "次回募集待ち",
      detail: en
        ? "Hold tight until the next ENTRY is announced. Re-forming opens then too."
        : "次回 ENTRY の告知までお待ちください。再招集もそのときから。",
      tone: "idle",
    };
  }

  if (phase === "entry") {
    if (!hasSquad) {
      return {
        kicker: "ENTRY",
        title: en
          ? deadline
            ? `Entry closes ${deadline}`
            : "Squads recruiting"
          : deadline
            ? `募集締切 ${deadline}`
            : "スクワッド募集中",
        detail: en
          ? `Locked at ${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS} members. Squads under ${SQUAD_BATTLE_MIN_MEMBERS} at the deadline don't enter.`
          : `${SQUAD_BATTLE_MIN_MEMBERS}〜${SQUAD_BATTLE_MAX_MEMBERS}人で確定。締切時点で${SQUAD_BATTLE_MIN_MEMBERS}人未満は不参加。`,
        tone: "entry",
      };
    }
    if (activeMemberCount < SQUAD_BATTLE_MIN_MEMBERS) {
      const missing = SQUAD_BATTLE_MIN_MEMBERS - activeMemberCount;
      return {
        kicker: "ENTRY",
        title: en
          ? `${missing} more member${missing === 1 ? "" : "s"} needed`
          : `あと ${missing} 人必要`,
        detail: en
          ? deadline
            ? `Closes ${deadline}. Under ${SQUAD_BATTLE_MIN_MEMBERS} members and your entry fails.`
            : `Under ${SQUAD_BATTLE_MIN_MEMBERS} members and your entry fails.`
          : deadline
            ? `締切 ${deadline}。${SQUAD_BATTLE_MIN_MEMBERS}人未満だとエントリー失敗になります。`
            : `${SQUAD_BATTLE_MIN_MEMBERS}人未満だとエントリー失敗になります。`,
        tone: "warn",
      };
    }
    if (activeMemberCount < SQUAD_BATTLE_MAX_MEMBERS) {
      return {
        kicker: "ENTRY",
        title: en
          ? deadline
            ? `Entry closes ${deadline}`
            : "Recruiting members"
          : deadline
            ? `募集締切 ${deadline}`
            : "メンバー募集中",
        detail: en
          ? `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · Minimum met. Locked when full or at the deadline.`
          : `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · 最低人数は満たしています。満員または締切で確定。`,
        tone: "entry",
      };
    }
    return {
      kicker: "ENTRY",
      title: en ? "Members locked · Standing by" : "メンバー確定 · 待機中",
      detail: en
        ? "Full, so no swaps. Wait for the battle to start."
        : "満員のため入れ替え不可。開催開始までお待ちください。",
      tone: "entry",
    };
  }

  if (phase === "battle") {
    return {
      kicker: "BATTLE",
      title: en
        ? hasSquad
          ? "In battle · Members LOCKED"
          : "Spectator mode"
        : hasSquad
          ? "対戦中 · メンバー LOCKED"
          : "観戦モード",
      detail: en
        ? hasSquad
          ? "No swaps after the start. You compete on average score across 4 weekly boards + the monthly board, Pick Up games only."
          : "You can view the board without entering. Join from the next ENTRY."
        : hasSquad
          ? "開始後の入れ替えは不可。Pick Up 試合の週間×4 + 月間で平均スコアを競います。"
          : "未参加でも順位表は閲覧できます。参加は次回 ENTRY から。",
      tone: "battle",
    };
  }

  return {
    kicker: "REWARD",
    title: en ? "Results final · Units paid" : "結果確定 · Unit 配布",
    detail: en
      ? "Weekly 1st pays 30 Units to every member, monthly 1st pays 100. The top 20 squads all earn rank-based Units, paid equally to every locked member."
      : "週間1位はメンバー全員に 30 Unit、月間1位は 100 Unit。上位20グループまで順位に応じた Unit を確定メンバー全員へ同額付与します。",
    tone: "reward",
  };
}

/** エントリーカード用ステータスチップ */
export function squadBattleEntryStatusChip(args: {
  phase: SquadBattleUiPhase;
  myRank?: number | null;
  deadlineLabel?: string | null;
  lang?: SquadBattleUiLang;
}): { label: string; tone: "entry" | "battle" | "reward" | "idle" } {
  const { phase, myRank, deadlineLabel } = args;
  const en = (args.lang ?? "ja") === "en";
  if (phase === "idle") {
    return { label: en ? "OFF SEASON" : "休止", tone: "idle" };
  }
  if (phase === "reward") {
    return { label: en ? "RESULTS" : "結果発表", tone: "reward" };
  }
  if (phase === "entry") {
    return {
      label: deadlineLabel
        ? en
          ? `BY ${deadlineLabel}`
          : `締切 ${deadlineLabel}`
        : en
          ? "RECRUITING"
          : "募集中",
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
export function squadOpenPeriodRankGroupLabel(
  lang: SquadBattleUiLang = "ja"
): string {
  return lang === "en" ? "Rank" : "順位";
}

export type SquadOpenPeriodRankKey =
  | "lastMonthRank"
  | "lastWeekRank"
  | "thisWeekRank";

export function squadOpenPeriodRanks(
  lang: SquadBattleUiLang = "ja"
): ReadonlyArray<{ key: SquadOpenPeriodRankKey; label: string }> {
  if (lang === "en") {
    return [
      { key: "lastMonthRank", label: "Last mo." },
      { key: "lastWeekRank", label: "Last wk." },
      { key: "thisWeekRank", label: "This wk." },
    ];
  }
  return [
    { key: "lastMonthRank", label: "先月" },
    { key: "lastWeekRank", label: "先週" },
    { key: "thisWeekRank", label: "今週" },
  ];
}

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

/** 報酬の共通脚注 */
export function squadBattleRewardPayoutNote(
  lang: SquadBattleUiLang = "ja"
): string {
  return lang === "en"
    ? "Paid equally to every locked member · Pick Up games only · up to 24h to appear"
    : "確定メンバー全員へ同額付与 · Pick Up 試合のみ · 反映まで最大24時間";
}

/**
 * サーバー（`loadMyGroupBattlePayout`）が返す payout ノート。
 * API レスポンスに埋めるため、キー → 文言をここに集約する。
 */
export type SquadBattlePayoutNoteKey =
  | "battleNotFound"
  | "notEntered"
  | "rankFinalUnitsPending"
  | "partiallyPaid"
  | "ledgerRecorded"
  | "noFinalResults";

export function squadBattlePayoutNote(
  key: SquadBattlePayoutNoteKey,
  lang: SquadBattleUiLang = "ja"
): string {
  const en = lang === "en";
  switch (key) {
    case "battleNotFound":
      return en ? "Battle not found." : "大会が見つかりません。";
    case "notEntered":
      return en
        ? "You didn't enter, so there's no payout this time. You can join from the next ENTRY."
        : "未参加のため配布対象外です。次回 ENTRY から参加できます。";
    case "rankFinalUnitsPending":
      return en
        ? "Ranks are final. Units can take up to 24h to appear"
        : "順位は確定。Unit 反映まで最大24時間かかる場合があります";
    case "partiallyPaid":
      return en
        ? "Partly paid. The rest can take up to 24h to appear"
        : "一部は付与済み。残りは反映まで最大24時間かかる場合があります";
    case "ledgerRecorded":
      return en
        ? "Recorded in the ledger · Pick Up games only · same for Free / Pro"
        : "台帳に記録済み · Pick Up 試合のみ · Free / Pro 共通";
    case "noFinalResults":
      return en ? "No final results yet" : "まだ確定結果がありません";
  }
}

/** 申請カードの相対時刻（API createdAtMs → 表示） */
export function formatSquadRequestRelativeTime(
  createdAtMs: number,
  lang: SquadBattleUiLang = "ja",
  nowMs: number = Date.now()
): string {
  const en = lang === "en";
  const ms = Number(createdAtMs);
  if (!Number.isFinite(ms) || ms <= 0) {
    return en ? "Pending" : "申請中";
  }
  const sec = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (sec < 60) return en ? "Just now" : "たった今";
  const min = Math.floor(sec / 60);
  if (min < 60) return en ? `${min}m ago` : `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return en ? `${hr}h ago` : `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return en ? "Yesterday" : "昨日";
  if (day < 30) return en ? `${day}d ago` : `${day}日前`;
  return en ? "Earlier" : "以前";
}

/** プレビューモックの相対ラベルを言語に合わせる */
export function localizeSquadMockRelativeLabel(
  label: string,
  lang: SquadBattleUiLang
): string {
  if (lang !== "en") return label;
  const map: Record<string, string> = {
    "12分前": "12m ago",
    "1時間前": "1h ago",
    "昨日": "Yesterday",
    "30分前": "30m ago",
    "申請中": "Pending",
    "たった今": "Just now",
  };
  return map[label] ?? label;
}

export function squadBattleRewardResultMock(
  lang: SquadBattleUiLang = "ja"
): SquadBattleRewardResult {
  return {
    weekly: [
      mockWeeklyPayout(1, 3),
      mockWeeklyPayout(2, 2),
      mockWeeklyPayout(3, 5),
      mockWeeklyPayout(4, 1),
    ],
    monthlyRank: 5,
    monthlyUnits: estimatedGroupBattleUnitsPerMember("monthly", 5) ?? 0,
    monthlyStatus: "paid",
    payoutNote: squadBattleRewardPayoutNote(lang),
  };
}

export function squadBattlePayoutTotalUnits(
  result: SquadBattleRewardResult
): number {
  const weekly = result.weekly.reduce((sum, w) => sum + w.units, 0);
  return weekly + result.monthlyUnits;
}

/** プレビュー既定の締切ラベル */
export const SQUAD_BATTLE_MOCK_DEADLINE_LABEL = "8/10 23:59";

/** 本番招待コード入力のプレースホルダ（実コードっぽい値は出さない） */
export const SQUAD_BATTLE_INVITE_CODE_PLACEHOLDER = "XXXX-XXXX";

export function squadInviteSendPrompt(
  displayName: string,
  squadName: string,
  lang: SquadBattleUiLang = "ja"
): string {
  return lang === "en"
    ? `Invite ${displayName} to ${squadName}?`
    : `${displayName} を ${squadName} に誘いますか？`;
}

export function squadApplicantApprovePrompt(
  displayName: string,
  lang: SquadBattleUiLang = "ja"
): string {
  return lang === "en"
    ? `Approve ${displayName}?`
    : `${displayName} を承認しますか？`;
}

export function squadInviteIncomingTitle(
  fromName: string,
  lang: SquadBattleUiLang = "ja"
): string {
  return lang === "en"
    ? `${fromName} invited you to a Squad Battle squad`
    : `${fromName} からスクワッドバトルの招待が来ています`;
}

/** 申請者カードの Score / 勝率は現行 NBA シーズン累計（今週ではない） */
export const SQUAD_APPLICANT_SEASON_SHORT = nbaSeasonShortLabel(
  CURRENT_NBA_SEASON_KEY
);

/** 招待・申請者カード周りの文言 */
export function squadBattleInviteCopy(lang: SquadBattleUiLang = "ja"): {
  holdHint: string;
  listTitle: string;
  listHint: string;
  listEmpty: string;
  joinPrompt: string;
  deadlinePrefix: string;
  openProfile: string;
  scoreLabel: string;
  winRateLabel: string;
  wrLabel: string;
} {
  const season = SQUAD_APPLICANT_SEASON_SHORT;
  if (lang === "en") {
    return {
      holdHint:
        "Hold it and you can join the inviting squad whenever you like.",
      listTitle: "Squads that invited you",
      listHint: "Squads that invited you. You can join from here.",
      listEmpty: "No invites right now.",
      joinPrompt: "Join this squad?",
      deadlinePrefix: "Entry deadline",
      openProfile: "View profile",
      scoreLabel: `${season} total`,
      winRateLabel: `${season} win %`,
      wrLabel: `${season} WR`,
    };
  }
  return {
    holdHint: "保留すると、招待されているスクワッドからいつでも参加できます。",
    listTitle: "招待されているスクワッド",
    listHint: "招待されたスクワッドです。ここから参加できます。",
    listEmpty: "届いている招待はありません。",
    joinPrompt: "このグループに参加しますか",
    deadlinePrefix: "エントリー期限",
    openProfile: "プロフィールを見る",
    scoreLabel: `${season} 累積`,
    winRateLabel: `${season} 勝率`,
    wrLabel: `${season} WR`,
  };
}

/** 開催告知モーダル（たたき台） */
export const SQUAD_BATTLE_LAUNCH_STORAGE_KEY =
  "uniterz:squad-battle-launch:v1";

export function squadBattleLaunchCopy(lang: SquadBattleUiLang = "ja"): {
  kicker: string;
  title: string;
  lead: string;
  cta: string;
  later: string;
  deadlinePrefix: string;
  facts: ReadonlyArray<{ kicker: string; value: string }>;
} {
  if (lang === "en") {
    return {
      kicker: "NOW OPEN",
      title: "SQUAD BATTLE",
      lead: "Recruiting is open. Build a squad of 3–5 and compete on average score in Pick Up games.",
      cta: "Join",
      later: "Later",
      deadlinePrefix: "Entry deadline",
      facts: [
        { kicker: "ENTRY", value: "1–2 weeks · no swaps once members lock" },
        { kicker: "PICK UP", value: "Selected games only" },
        { kicker: "SQUAD", value: "3–5 players" },
        { kicker: "REWARD", value: "Weekly 1st 30 · monthly 1st 100 Units (each)" },
      ],
    };
  }
  return {
    kicker: "NOW OPEN",
    title: "SQUAD BATTLE",
    lead: "募集が始まりました。3〜5人のスクワッドで、Pick Up 試合の平均スコアを競う。",
    cta: "参加する",
    later: "あとで",
    deadlinePrefix: "エントリー期限",
    facts: [
      { kicker: "ENTRY", value: "約1〜2週間 · メンバー確定後は入れ替え不可" },
      { kicker: "PICK UP", value: "対象試合のみ" },
      { kicker: "SQUAD", value: "3〜5人" },
      { kicker: "REWARD", value: "週1位 30 · 月1位 100 Unit（全員）" },
    ],
  };
}

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

/** 初回イントロ全画面の付随文言（本文はフェーズ / タグライン側） */
export function squadBattleIntroOverlayCopy(lang: SquadBattleUiLang = "ja"): {
  skip: string;
  srSummary: string;
} {
  if (lang === "en") {
    return {
      skip: "Skip",
      srSummary:
        "About Squad Battle. Squads of 3–5 compete on average score. About 1–2 weeks of recruiting, about a month of battle, then Units for the top squads once results are final.",
    };
  }
  return {
    skip: "スキップ",
    srSummary:
      "スクワッドバトルの説明。3〜5人で平均スコアを競う。募集約1〜2週間、バトル約1ヶ月、結果確定後に上位へ Unit 配布。",
  };
}

/**
 * SQUAD BATTLE 画面（Web `SquadBattlePage` / Native `SquadBattleScreenNative`）の
 * ユーザー可視文言。Web / Native で重複させないためここに集約する。
 */
export function squadBattleScreenCopy(lang: SquadBattleUiLang = "ja") {
  const en = lang === "en";
  return {
    // --- 共通アクション ---
    close: en ? "Close" : "閉じる",
    cancel: "Cancel",
    createGroup: en ? "Create squad" : "グループを作成",
    createGroupAriaLabel: en ? "Create squad" : "グループ作成",
    createSubmit: en ? "Create" : "作成する",
    joinByInviteCode: en ? "Join by code" : "招待コードで参加",
    joinByInviteCodeAriaLabel: en ? "Join by invite code" : "招待コードで参加",
    apply: en ? "Apply" : "申請する",
    applyShort: en ? "Apply" : "申請",
    applying: en ? "Applied" : "申請中",
    withdraw: en ? "Withdraw" : "取り下げ",
    approve: en ? "Approve" : "承認",
    approveSubmit: en ? "Approve" : "承認する",
    reject: en ? "Reject" : "拒否",
    join: en ? "Join" : "参加する",
    joining: en ? "Joining…" : "参加中…",
    hold: en ? "Hold" : "保留する",
    passThisTime: en ? "Not this time" : "今回はパス",
    invite: en ? "Invite" : "誘う",
    dissolve: en ? "Dissolve" : "解散する",
    leave: en ? "Leave" : "脱退する",
    viewRank: en ? "View RANK" : "RANK を見る",

    // --- MY SQUAD ---
    squadNameLabel: en ? "Squad name" : "スクワッド名",
    renameSquadLabel: en ? "Rename squad" : "スクワッド名を変更",
    copyInviteCodeLabel: (code: string) =>
      en ? `Copy invite code ${code}` : `招待コード ${code} をコピー`,
    tapToCopy: en ? "Tap to copy" : "タップでコピー",
    emptySlotTitle: en ? "Open slot · Recruiting" : "空き枠 · 募集中",
    recruitingLabel: en ? "Recruiting" : "募集中",
    membersLockedNotice: en
      ? "Members LOCKED · swaps and new applications are closed."
      : "メンバー LOCKED · 入れ替え・追加申請の受付は終了しています。",

    // --- 作成シート ---
    createNameHint: en
      ? "Shown to your opponents · can be changed later"
      : "対戦相手に表示される名前 · あとから変更可",
    createConsent: (min: number, max: number) =>
      en
        ? `I agree that the squad locks at ${min}–${max} members, that no swaps are allowed after the start, that ties share the rank and the Units, and that cheating means disqualification. You become the squad owner.`
        : `${min}〜${max}人で確定し、開始後の入れ替え不可・同点は同順位同 Unit・不正は失格に同意します。あなたが代表者になります。`,

    // --- 招待コードシート ---
    inviteCodeHint: en
      ? "Enter the code shared by the squad owner"
      : "代表者から共有されたコードを入力",

    // --- 申請 / 承認シート ---
    applicantProfileAriaLabel: en ? "Applicant profile" : "申請者プロフィール",
    applicantProfileOf: (name: string) =>
      en ? `${name}'s profile` : `${name}のプロフィール`,
    applyConfirmBody: en
      ? "Apply to join this squad"
      : "このグループへの参加を申請します",
    inviteFrom: (name: string) =>
      en ? `Invite from ${name}` : `${name} からの招待`,
    thisWeek: en ? "This week" : "今週",
    applicationMeta: (label: string) =>
      en ? `Application · ${label}` : `申請 · ${label}`,

    // --- 一覧 / セクション ---
    membersExpand: en ? "Show members" : "メンバーを見る",
    membersCollapse: en ? "Hide members" : "メンバーを閉じる",
    pastSquadsKicker: "Past squads",
    pastSquadsTitle: en ? "Past squads" : "過去のスクワッド",
    pastSquadsRecent: (count: number) =>
      en ? `Last ${count} battles` : `直近 ${count} 大会`,
    pastSquadsEmpty: en
      ? "No past squads yet. They show up here once a battle ends."
      : "まだ過去のスクワッドがありません。大会終了後にここに表示されます。",
    roleOwnerSuffix: en ? " · Owner" : " · 代表",
    roleMemberSuffix: en ? " · Member" : " · メンバー",
    reformCta: en ? "Recruit the same members" : "同じメンバーで募集",
    reformAriaLabel: en ? "Recruit the same members" : "同じメンバーで募集",
    reformSubmit: en ? "Send invites" : "招待を送る",
    reformOnlyWhenFree: en
      ? "You can recruit the same members only while you're not in a squad."
      : "未所属時に「同じメンバーで募集」できます",
    myApplicationsKicker: "My applications",
    applicationLimitHint: (max: number) =>
      en
        ? `You can have up to ${max} applications open. Add more once one is approved or withdrawn.`
        : `申請は最大 ${max} 件までです。承認または取り下げ後に追加できます。`,
    noOutgoingApplications: en
      ? "No applications pending."
      : "送信中の参加申請はありません。",
    awaitingApproval: en ? "Awaiting approval" : "承認待ち",
    openSquadsKicker: "Open squads",
    openSquadsTitle: en ? "Open slots" : "空き枠あり",
    noOpenSquads: en
      ? "No public squads have open slots right now. Create a squad, or join with an invite code."
      : "いま空き枠のある公開スクワッドはありません。グループを作成するか、招待コードで参加してください。",
    joinRequestsKicker: "Join requests",
    joinRequestsTitle: en ? "Join requests" : "参加申請",
    invitesKicker: "Invites",

    // --- REWARD ---
    rewardLoading: en ? "Loading your Units…" : "獲得 Unit を読み込み中…",
    rewardNotEligible: en
      ? "You didn't enter, so there's no payout this time. You can join from the next ENTRY."
      : "未参加のため配布対象外です。次回 ENTRY から参加できます。",

    // --- JOIN タブの状態文 ---
    spectatorDuringBattle: en
      ? "The battle is live, so creating or joining is closed. You can watch the board on the RANK tab."
      : "バトル中のため新規参加・作成はできません。順位表は RANK タブで観戦できます。",
    lockingNotice: en
      ? "Members are being finalized. Recruiting has closed."
      : "メンバー確定中です。募集は締め切られました。",
    announcedNotice: en
      ? "Recruiting opens shortly. Hang tight."
      : "まもなく募集が始まります。開始までお待ちください。",
    joinClosedNotice: en
      ? "Joining and creating are closed right now."
      : "いまは参加・作成できません。",

    // --- RANK タブ ---
    periodTabsLabel: en ? "Weekly / Monthly" : "週間・月間",
    boardBattleTitle: (battleId: string) =>
      en ? `Battle ${battleId}` : `大会 ${battleId}`,
    boardPreviewTitle: en ? "Preview (mock)" : "プレビュー（モック）",
    boardUpdatedPrefix: en ? "Updated" : "更新",
    monthlyHint: en
      ? "Monthly · average score across the whole battle"
      : "月間 · 開催期間全体の平均スコア",
    leaderboardEmpty: en
      ? "No squads to show on the leaderboard."
      : "リーダーボードに表示するグループがありません。",

    // --- ページネーション ---
    paginationLabel: en ? "Pagination" : "ページ",
    prevPage: en ? "Previous page" : "前のページ",
    nextPage: en ? "Next page" : "次のページ",
    pageNumber: (page: number) => (en ? `Page ${page}` : `${page}ページ目`),

    // --- トースト ---
    justNow: en ? "Just now" : "たった今",
    flashReformFailed: (error: string) =>
      en ? `Re-form failed: ${error}` : `再招集失敗: ${error}`,
    flashReformDone: (name: string, invited: number, skipped: number) =>
      en
        ? `Re-formed ${name} (invited ${invited} / skipped ${skipped})`
        : `再招集: ${name}（招待 ${invited} / スキップ ${skipped}）`,
    flashReformError: en ? "Couldn't re-form the squad" : "再招集に失敗しました",
    flashReformMock: (name: string) =>
      en ? `Recruiting the same members: ${name}` : `同じメンバーで募集: ${name}`,
    flashInviteSent: en ? "Invite sent" : "招待を送りました",
    flashInviteSentTo: (name: string) =>
      en ? `Invite sent to ${name}` : `招待を送りました: ${name}`,
    flashInviteFailed: (error: string) =>
      en ? `Invite failed: ${error}` : `招待失敗: ${error}`,
    flashInviteError: en ? "Couldn't send the invite" : "招待に失敗しました",
    flashJoinFailed: (error: string) =>
      en ? `Join failed: ${error}` : `参加失敗: ${error}`,
    flashJoined: (name: string) => (en ? `Joined ${name}` : `参加: ${name}`),
    flashJoinError: en ? "Couldn't join" : "参加に失敗しました",
    flashJoinedSquad: en ? "Joined the squad" : "スクワッドに参加しました",
    flashJoinedByCode: en
      ? "Joined with the invite code"
      : "招待コードで参加しました",
    flashPassFailed: (error: string) =>
      en ? `Decline failed: ${error}` : `パス失敗: ${error}`,
    flashPassError: en ? "Couldn't decline" : "パスに失敗しました",
    flashPassed: (name: string) =>
      en ? `Declined ${name}` : `パス: ${name}`,
    flashInvalidCode: en ? "That code isn't valid" : "コードが無効です",
    flashInvalidCodePreview: en
      ? "That code isn't valid (preview uses NC-7K2M)"
      : "コードが無効です（プレビューは NC-7K2M）",
    flashCreateFailed: (error: string) =>
      en ? `Create failed: ${error}` : `作成失敗: ${error}`,
    flashCreated: (name: string) =>
      en ? `Created ${name}` : `グループを作成: ${name}`,
    flashCreateError: en ? "Couldn't create the squad" : "作成に失敗しました",
    flashNoActiveBattle: en
      ? "No battle is running right now"
      : "開催中の大会がありません",
    flashApplicationLimit: (max: number) =>
      en ? `Up to ${max} applications at once` : `申請は最大${max}件まで`,
    flashApplyFailed: (error: string) =>
      en ? `Application failed: ${error}` : `申請失敗: ${error}`,
    flashApplySent: (name: string) =>
      en ? `Applied to ${name}` : `申請を送信: ${name}`,
    flashApplyError: en ? "Couldn't send the application" : "申請に失敗しました",
    flashResolveFailed: (decision: "approve" | "reject", error: string) =>
      en
        ? `${decision === "approve" ? "Approve" : "Reject"} failed: ${error}`
        : `${decision === "approve" ? "承認" : "拒否"}失敗: ${error}`,
    flashResolveDone: (decision: "approve" | "reject", name: string) =>
      en
        ? `${decision === "approve" ? "Approved" : "Rejected"} ${name}`
        : `${decision === "approve" ? "承認" : "拒否"}: ${name}`,
    flashResolveError: en ? "Couldn't process that" : "処理に失敗しました",
    flashRenameFailed: (error: string) =>
      en ? `Rename failed: ${error}` : `名前変更失敗: ${error}`,
    flashRenamed: (name: string) =>
      en ? `Renamed to ${name}` : `名前を変更: ${name}`,
    flashRenameError: en ? "Couldn't rename the squad" : "名前変更に失敗しました",
    flashWithdrawFailed: (error: string) =>
      en ? `Withdraw failed: ${error}` : `取り下げ失敗: ${error}`,
    flashWithdrawn: (name: string) =>
      en ? `Withdrew from ${name}` : `申請を取り下げ: ${name}`,
    flashWithdrawError: en
      ? "Couldn't withdraw the application"
      : "取り下げに失敗しました",
    flashLeaveFailed: (error: string) =>
      en ? `Leave failed: ${error}` : `脱退失敗: ${error}`,
    flashLeft: en ? "Left the squad" : "スクワッドから脱退しました",
    flashLeaveError: en ? "Couldn't leave the squad" : "脱退に失敗しました",
    flashDissolveFailed: (error: string) =>
      en ? `Dissolve failed: ${error}` : `解散失敗: ${error}`,
    flashDissolved: en ? "Squad dissolved" : "スクワッドを解散しました",
    flashDissolveError: en
      ? "Couldn't dissolve the squad"
      : "解散に失敗しました",
    flashCopied: (code: string) =>
      en ? `Copied: ${code}` : `コピーしました: ${code}`,
    flashCopyFailed: (code: string) =>
      en ? `Copy failed: ${code}` : `コピー失敗: ${code}`,
    flashInviteCode: (code: string) =>
      en ? `Invite code: ${code}` : `招待コード: ${code}`,
    flashHeldInvite: en
      ? "Held. You can join from the inviting squad later."
      : "保留しました。招待されているスクワッドから参加できます",
  } as const;
}

export type SquadBattleScreenCopy = ReturnType<typeof squadBattleScreenCopy>;
