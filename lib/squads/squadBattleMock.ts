/**
 * SQUAD BATTLE（グループ対抗戦）プレビュー用の型とモック。
 * 本番 API / Firestore には未接続。
 */

export type SquadBattlePreviewState = "none" | "recruiting" | "full";

export type SquadMember = {
  uid: string;
  handle: string;
  displayName: string;
  /** 総合得点（pointsSumV3 想定） */
  points: number;
  /** 空き枠（募集中スロット） */
  empty?: boolean;
  plan?: "free" | "pro";
  photoURL?: string | null;
  /** 本番 ENTRY enrich 済みなら true（モック順位を使わない） */
  fromLive?: boolean;
  /** シーズン累積点（プロフィール用。バトル行の points と別） */
  seasonPoints?: number;
  winRate?: number;
  activeWinStreak?: number;
  totalPosts?: number;
  lastMonthRank?: number | null;
  lastWeekRank?: number | null;
  thisWeekRank?: number | null;
  bio?: string;
};

export type Squad = {
  id: string;
  name: string;
  /** 常に 5 枠（空きは empty: true） */
  members: SquadMember[];
  avgPoints: number;
  rank: number;
  /** 前回順位（変動表示用。未設定なら変動なし扱い） */
  prevRank?: number;
  isMine?: boolean;
  /**
   * 募集中のみ発行される招待コード。
   * 満員 / 未参加時は null。
   */
  inviteCode?: string | null;
  /** 首位キープ週数（1位のカード表示用） */
  weeksAtTop?: number;
  /** 平均得点の当日増減（ランキング metricValueDelta 相当） */
  avgPointsDayDelta?: number | null;
};

/**
 * 順位変動量（正 = 上昇、負 = 下降、0 = 変動なし）。
 * `prevRank - rank`
 */
export function squadRankDelta(squad: Pick<Squad, "rank" | "prevRank">): number {
  if (squad.prevRank == null) return 0;
  return squad.prevRank - squad.rank;
}

/** 申請者のプロフィール要約（プレビュー用） */
export type SquadApplicantProfile = {
  uid: string;
  handle: string;
  displayName: string;
  /** 現行 NBA シーズン（26-27）累積 `pointsSumV3` */
  points: number;
  /** 現行 NBA シーズン（26-27）累積勝率（%） */
  winRate: number;
  activeWinStreak: number;
  totalPosts: number;
  bio: string;
  /** 個人ランキング（募集判断用。バトル未開始のためスコアは出さない） */
  lastMonthRank?: number | null;
  lastWeekRank?: number | null;
  thisWeekRank?: number | null;
  plan?: "free" | "pro";
  photoURL?: string | null;
};

export type SquadJoinRequest = {
  id: string;
  squadId: string;
  squadName: string;
  /** pending | approved | rejected */
  status: "pending" | "approved" | "rejected";
  createdAtLabel: string;
  applicant: SquadApplicantProfile;
};

/** 空き枠のある公開スクワッド（未参加時の一覧用） */
export type OpenSquadListing = {
  id: string;
  name: string;
  avgPoints: number;
  openSlots: number;
  memberCount: number;
  /** 現メンバー（プロフィール閲覧用） */
  members: SquadApplicantProfile[];
};

export const SQUAD_BATTLE_MAX_MEMBERS = 5;

/** 最小人数（正: docs/group-battle-design.md） */
export const SQUAD_BATTLE_MIN_MEMBERS = 3;

/** スクワッド名の最大文字数（作成時） */
export const SQUAD_BATTLE_NAME_MAX_LEN = 20;

/** 同時に出せる参加申請の上限 */
export const SQUAD_BATTLE_MAX_PENDING_APPLICATIONS = 3;

/** 開催サイクルの1フェーズ（イントロ / ヘルプ共用） */
export type SquadBattleSeasonPhase = {
  key: "entry" | "battle" | "reward";
  label: string;
  period: string;
  desc: string;
};

/**
 * 開催サイクル（約2ヶ月に1回）。
 * ENTRY → BATTLE → REWARD → 次回 ENTRY。
 * 正: docs/group-battle-design.md / lib/groupBattles/constants.ts
 */
export const SQUAD_BATTLE_SEASON_PHASES: readonly SquadBattleSeasonPhase[] = [
  {
    key: "entry",
    label: "ENTRY",
    period: "約1〜2週間前",
    desc: "スクワッド確定 · 開始後は入れ替え不可",
  },
  {
    key: "battle",
    label: "BATTLE",
    period: "約1ヶ月",
    desc: "Pick Up 試合の平均スコア。週間×4 + 月間×1",
  },
  {
    key: "reward",
    label: "REWARD",
    period: "結果確定後",
    desc: "週間1位は全員 30 Unit、月間1位は全員 100 Unit。上位20まで順位に応じて獲得",
  },
] as const;

/** 初回イントロのルール1行（キッカー／フェーズと重複しないこと） */
export const SQUAD_BATTLE_INTRO_TAGLINE =
  "3〜5人のスクワッドで、Pick Up 試合の総合スコア平均を競う。";

/** はてな（？）ヘルプ用のルール要約 */
export const SQUAD_BATTLE_HELP_TEXT = `3〜5人のスクワッドで、メンバー全員の総合スコア平均を競います。対象は Pick Up 試合のみ（PRO LEAGUE の全試合スコアは使いません）。所属できるグループは1大会につき1つまで。空き枠があるグループに申請し、承認されると参加できます。募集中は招待コードでも参加可能。同時申請は最大${SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}件。約2ヶ月に1回開催。募集は開催約1〜2週間前から → メンバー確定後は入れ替え不可 → 1ヶ月間バトル（週間ランキング原則4回 + 月間1回）→ 結果確定後に週間1位はメンバー全員へ 30 Unit、月間1位は 100 Unit。上位20グループまで順位に応じた Unit を確定メンバー全員へ同額配布。過去のスクワッドから同じ顔ぶれを再招集できます。`;

/** 初回イントロ既読フラグ（localStorage） */
export const SQUAD_BATTLE_INTRO_STORAGE_KEY = "uniterz:squad-battle-intro:v1";

/** モック用の自スクワッド招待コード（募集中） */
export const SQUAD_BATTLE_MOCK_INVITE_CODE = "NC-7K2M";

/** プレビュー用の個人順位（1桁〜2桁が混ざるようにして表示確認用） */
function mockPeriodRanks(points: number): Pick<
  SquadApplicantProfile,
  "lastMonthRank" | "lastWeekRank" | "thisWeekRank"
> {
  const thisWeekRank = Math.max(1, Math.round(90 - points / 12));
  const lastWeekRank = Math.max(1, thisWeekRank + (Math.round(points) % 9) - 4);
  const lastMonthRank = Math.max(1, thisWeekRank + (Math.round(points) % 13) - 6);
  return { lastMonthRank, lastWeekRank, thisWeekRank };
}

/** メンバー表示 → プロフィール要約 */
export function squadMemberToProfile(member: SquadMember): SquadApplicantProfile {
  if (member.fromLive) {
    return {
      uid: member.uid,
      handle: member.handle,
      displayName: member.displayName,
      points: member.seasonPoints ?? member.points,
      winRate: member.winRate ?? 0,
      activeWinStreak: member.activeWinStreak ?? 0,
      totalPosts: member.totalPosts ?? 0,
      bio: member.bio ?? "",
      plan: member.plan,
      photoURL: member.photoURL,
      lastMonthRank: member.lastMonthRank ?? null,
      lastWeekRank: member.lastWeekRank ?? null,
      thisWeekRank: member.thisWeekRank ?? null,
    };
  }
  return {
    uid: member.uid,
    handle: member.handle,
    displayName: member.displayName,
    points: member.points,
    winRate: Math.round((48 + (member.points % 17)) * 10) / 10,
    activeWinStreak: member.points % 6,
    totalPosts: 40 + (member.points % 90),
    bio: `${member.displayName} のプロフィール（プレビュー）。`,
    plan: member.plan,
    photoURL: member.photoURL,
    ...mockPeriodRanks(member.points),
  };
}

function makeOpenMember(
  uid: string,
  handle: string,
  displayName: string,
  points: number,
  winRate: number,
  streak: number,
  posts: number,
  bio: string,
  plan?: "free" | "pro"
): SquadApplicantProfile {
  return {
    uid,
    handle,
    displayName,
    points,
    winRate,
    activeWinStreak: streak,
    totalPosts: posts,
    bio,
    plan: plan ?? (points >= 850 ? "pro" : "free"),
    ...mockPeriodRanks(points),
  };
}

export const SQUAD_BATTLE_PREVIEW_STATES: {
  id: SquadBattlePreviewState;
  label: string;
}[] = [
  { id: "none", label: "未参加" },
  { id: "recruiting", label: "募集中" },
  { id: "full", label: "満員" },
];

function emptySlot(index: number): SquadMember {
  return {
    uid: `empty-${index}`,
    handle: "",
    displayName: "募集中",
    points: 0,
    empty: true,
  };
}

function padMembers(members: SquadMember[]): SquadMember[] {
  const filled = members.slice(0, SQUAD_BATTLE_MAX_MEMBERS);
  while (filled.length < SQUAD_BATTLE_MAX_MEMBERS) {
    filled.push(emptySlot(filled.length));
  }
  return filled;
}

function avgOf(members: SquadMember[]): number {
  const active = members.filter((m) => !m.empty);
  if (active.length === 0) return 0;
  const sum = active.reduce((acc, m) => acc + m.points, 0);
  return Math.round((sum / active.length) * 10) / 10;
}

/**
 * 総合得点（pointsSumV3 / rankings totalPoints）想定のモック。
 * アプリ他プレビュー（例: 1284）と同スケール。1試合おおむね 0〜10+ の累積。
 */

const MY_MEMBERS_FULL: SquadMember[] = [
  { uid: "me", handle: "kamiya", displayName: "Kamiya", points: 1284, plan: "pro" },
  { uid: "u2", handle: "neonfox", displayName: "NeonFox", points: 1210, plan: "free" },
  { uid: "u3", handle: "orbit", displayName: "Orbit", points: 1186, plan: "pro" },
  { uid: "u4", handle: "pulse", displayName: "Pulse", points: 1095, plan: "free" },
  { uid: "u5", handle: "rift", displayName: "Rift", points: 1028, plan: "pro" },
];

const MY_MEMBERS_RECRUITING: SquadMember[] = [
  { uid: "me", handle: "kamiya", displayName: "Kamiya", points: 1284, plan: "pro" },
  { uid: "u2", handle: "neonfox", displayName: "NeonFox", points: 1210, plan: "free" },
  { uid: "u3", handle: "orbit", displayName: "Orbit", points: 1186, plan: "pro" },
];

const BOARD_MEMBER_NAMES = [
  "MetroFox",
  "NeonPulse",
  "OrbitBlade",
  "KamiyaRio",
  "NightStalker",
] as const;

function makeSquad(
  id: string,
  name: string,
  memberPoints: number[],
  rank: number,
  isMine = false,
  prevRank?: number,
  weeksAtTop?: number,
  avgPointsDayDelta?: number | null
): Squad {
  const members = padMembers(
    memberPoints.map((points, i) => ({
      uid: `${id}-m${i}`,
      handle: `player_${id}_${i}`,
      displayName: BOARD_MEMBER_NAMES[i] ?? `P${i + 1}`,
      points,
      plan: i % 2 === 0 ? "pro" : "free",
    }))
  );
  return {
    id,
    name,
    members,
    avgPoints: avgOf(members),
    rank,
    prevRank: prevRank ?? rank,
    isMine,
    weeksAtTop,
    avgPointsDayDelta: avgPointsDayDelta ?? null,
  };
}

/** グローバル順位表モック（自スクワッド以外）— 平均総合得点で並ぶ */
const BOARD_OTHERS: Omit<Squad, "rank" | "isMine">[] = [
  // prevRank / 当日増減は上昇・下降・横ばいが混在するよう設定
  makeSquad("sq-alpha", "CYAN WOLVES", [1542, 1498, 1471, 1440, 1412], 0, false, 2, 3, 48),
  makeSquad("sq-beta", "GRID RUNNERS", [1420, 1388, 1365, 1332, 1305], 0, false, 1, undefined, 22),
  makeSquad("sq-gamma", "VOID SQUAD", [1368, 1340, 1312, 1285, 1258], 0, false, 3, undefined, 15),
  makeSquad("sq-delta", "HEX UNIT", [1295, 1268, 1240, 1215, 1188], 0, false, 6, undefined, 8),
  makeSquad("sq-echo", "SIGNAL 5", [1220, 1195, 1168, 1140, 1112], 0, false, 4, undefined, -4),
  makeSquad("sq-foxtrot", "LANE LOCK", [1148, 1120, 1095, 1068, 1040], 0, false, 5, undefined, 11),
  makeSquad("sq-golf", "OVERTIME", [1075, 1048, 1022, 995, 968], 0, false, 9, undefined, 6),
  makeSquad("sq-hotel", "CLUTCH CREW", [1005, 978, 952, 925, 898], 0, false, 7, undefined, 0),
  makeSquad("sq-india", "BENCH MOB", [930, 905, 878, 852, 825], 0, false, 10, undefined, 3),
  makeSquad("sq-juliet", "LAST CALL", [860, 835, 808, 782, 755], 0, false, 11, undefined, -2),
  makeSquad("sq-kilo", "ROOKIE FIVE", [790, 762, 735, 708, 682], 0, false, 12, undefined, 5),
  makeSquad("sq-lima", "PRACTICE", [720, 695, 668, 642, 615], 0, false, 13, undefined, 1),
  makeSquad("sq-mike", "RIM RUN", [680, 655, 628, 602, 575], 0, false, 14, undefined, 4),
  makeSquad("sq-november", "BOX OUT", [640, 615, 588, 562, 535], 0, false, 16, undefined, -1),
  makeSquad("sq-oscar", "FAST BREAK", [600, 575, 548, 522, 495], 0, false, 15, undefined, 7),
  makeSquad("sq-papa", "PAINT PACK", [560, 535, 508, 482, 455], 0, false, 17, undefined, 2),
  makeSquad("sq-quebec", "FLOOR FIVE", [520, 495, 468, 442, 415], 0, false, 18, undefined, 0),
  makeSquad("sq-romeo", "TIMEOUT", [480, 455, 428, 402, 375], 0, false, 20, undefined, 3),
  makeSquad("sq-sierra", "ALLEY OOP", [440, 415, 388, 362, 335], 0, false, 19, undefined, -3),
  makeSquad("sq-tango", "SET PLAY", [400, 375, 348, 322, 295], 0, false, 21, undefined, 1),
].map(({ id, name, members, avgPoints, prevRank, weeksAtTop, avgPointsDayDelta }) => ({
  id,
  name,
  members,
  avgPoints,
  prevRank,
  weeksAtTop,
  avgPointsDayDelta,
}));

/** 未参加時に見える「空き枠あり」スクワッド */
const OPEN_SQUAD_LISTINGS: OpenSquadListing[] = [
  {
    id: "sq-open-1",
    name: "AETHER FIVE",
    avgPoints: 918,
    openSlots: 2,
    memberCount: 3,
    members: [
      makeOpenMember("o1a", "aether_a", "AetherA", 980, 56.2, 2, 78, "ミッドレンジ狙い。"),
      makeOpenMember("o1b", "aether_b", "AetherB", 910, 54.0, 1, 64, "安定志向。"),
      makeOpenMember("o1c", "aether_c", "AetherC", 864, 51.8, 0, 52, "週末メイン。"),
    ],
  },
  {
    id: "sq-open-2",
    name: "MIDNIGHT RUN",
    avgPoints: 812,
    openSlots: 1,
    memberCount: 4,
    members: [
      makeOpenMember("o2a", "nightowl", "NightOwl", 885, 59.1, 5, 91, "深夜帯に集中。"),
      makeOpenMember("o2b", "luna_x", "LunaX", 840, 55.4, 2, 70, "精度重視。"),
      makeOpenMember("o2c", "shadow_k", "ShadowK", 790, 52.6, 1, 58, "アップセット好き。"),
      makeOpenMember("o2d", "echo_n", "EchoN", 732, 50.2, 0, 44, "コツコツ型。"),
    ],
  },
  {
    id: "sq-open-3",
    name: "GLITCH LAB",
    avgPoints: 698,
    openSlots: 3,
    memberCount: 2,
    members: [
      makeOpenMember("o3a", "glitch_1", "Glitch1", 745, 53.3, 3, 61, "実験的ピック多め。"),
      makeOpenMember("o3b", "glitch_2", "Glitch2", 651, 49.8, 0, 39, "一緒に伸ばしたい。"),
    ],
  },
  {
    id: "sq-open-4",
    name: "LOW BATTERY",
    avgPoints: 548,
    openSlots: 2,
    memberCount: 3,
    members: [
      makeOpenMember("o4a", "lowbat_a", "LowBatA", 602, 51.0, 1, 47, "ライト勢歓迎。"),
      makeOpenMember("o4b", "lowbat_b", "LowBatB", 540, 48.5, 0, 33, "のんびり派。"),
      makeOpenMember("o4c", "lowbat_c", "LowBatC", 502, 47.2, 0, 28, "新人向け。"),
    ],
  },
  {
    id: "sq-open-5",
    name: "ROOKIE DOCK",
    avgPoints: 386,
    openSlots: 4,
    memberCount: 1,
    members: [
      makeOpenMember("o5a", "rookie_cap", "RookieCap", 386, 46.0, 1, 22, "創設したばかり。歓迎！"),
    ],
  },
  {
    id: "sq-open-6",
    name: "PIXEL CREW",
    avgPoints: 352,
    openSlots: 2,
    memberCount: 3,
    members: [
      makeOpenMember("o6a", "pixel_a", "PixelA", 390, 48.0, 1, 30, "カジュアル歓迎。"),
      makeOpenMember("o6b", "pixel_b", "PixelB", 340, 46.5, 0, 24, "一緒に成長したい。"),
      makeOpenMember("o6c", "pixel_c", "PixelC", 326, 45.2, 0, 18, "週末メイン。"),
    ],
  },
  {
    id: "sq-open-7",
    name: "SOFT RESET",
    avgPoints: 310,
    openSlots: 3,
    memberCount: 2,
    members: [
      makeOpenMember("o7a", "soft_r", "SoftR", 330, 47.1, 2, 26, "気軽にどうぞ。"),
      makeOpenMember("o7b", "reset_k", "ResetK", 290, 44.8, 0, 15, "初心者OK。"),
    ],
  },
  {
    id: "sq-open-8",
    name: "NIGHT SHIFT",
    avgPoints: 278,
    openSlots: 1,
    memberCount: 4,
    members: [
      makeOpenMember("o8a", "shift_1", "Shift1", 310, 49.0, 1, 33, "深夜帯向け。"),
      makeOpenMember("o8b", "shift_2", "Shift2", 285, 46.2, 0, 21, "落ち着いてやりたい。"),
      makeOpenMember("o8c", "shift_3", "Shift3", 268, 45.0, 0, 19, "コツコツ型。"),
      makeOpenMember("o8d", "shift_4", "Shift4", 249, 43.5, 0, 14, "空き1。"),
    ],
  },
  {
    id: "sq-open-9",
    name: "WARM UP",
    avgPoints: 240,
    openSlots: 2,
    memberCount: 3,
    members: [
      makeOpenMember("o9a", "warm_a", "WarmA", 265, 45.5, 1, 20, "練習中。"),
      makeOpenMember("o9b", "warm_b", "WarmB", 238, 44.0, 0, 16, "ゆるめ募集。"),
      makeOpenMember("o9c", "warm_c", "WarmC", 217, 42.8, 0, 12, "気軽に。"),
    ],
  },
  {
    id: "sq-open-10",
    name: "FIRST LIGHT",
    avgPoints: 198,
    openSlots: 3,
    memberCount: 2,
    members: [
      makeOpenMember("o10a", "first_l", "FirstL", 210, 43.2, 0, 11, "新規歓迎。"),
      makeOpenMember("o10b", "dawn_x", "DawnX", 186, 41.5, 0, 9, "一緒に始めよう。"),
    ],
  },
];

/** 一覧の1ページ件数 */
export const SQUAD_BATTLE_OPEN_PAGE_SIZE = 5;
export const SQUAD_BATTLE_BOARD_PAGE_SIZE = 5;

/** 募集中スクワッドへの参加申請（オーナー視点） */
const INCOMING_JOIN_REQUESTS: SquadJoinRequest[] = [
  {
    id: "req-in-1",
    squadId: "sq-mine",
    squadName: "NEON CIRCUIT",
    status: "pending",
    createdAtLabel: "12分前",
    applicant: {
      uid: "app-1",
      handle: "bladezero",
      displayName: "BladeZero",
      points: 1195,
      winRate: 58.2,
      activeWinStreak: 4,
      totalPosts: 86,
      bio: "プレーオフ予想メイン。アップセット狙い多め。",
      plan: "pro",
      ...mockPeriodRanks(1195),
    },
  },
  {
    id: "req-in-2",
    squadId: "sq-mine",
    squadName: "NEON CIRCUIT",
    status: "pending",
    createdAtLabel: "1時間前",
    applicant: {
      uid: "app-2",
      handle: "sakura_q",
      displayName: "Sakura Q",
      points: 1080,
      winRate: 61.5,
      activeWinStreak: 2,
      totalPosts: 112,
      bio: "安定志向。精度重視でコツコツ積み上げ。",
      plan: "free",
      ...mockPeriodRanks(1080),
    },
  },
  {
    id: "req-in-3",
    squadId: "sq-mine",
    squadName: "NEON CIRCUIT",
    status: "pending",
    createdAtLabel: "昨日",
    applicant: {
      uid: "app-3",
      handle: "metrofox",
      displayName: "MetroFox",
      points: 820,
      winRate: 52.0,
      activeWinStreak: 0,
      totalPosts: 54,
      bio: "週末だけ本気出すタイプ。",
      plan: "pro",
      ...mockPeriodRanks(820),
    },
  },
];

/** 未参加時に自分が出した申請（申請者視点） */
const OUTGOING_JOIN_REQUESTS: SquadJoinRequest[] = [
  {
    id: "req-out-1",
    squadId: "sq-open-2",
    squadName: "MIDNIGHT RUN",
    status: "pending",
    createdAtLabel: "30分前",
    applicant: {
      uid: "me",
      handle: "kamiya",
      displayName: "Kamiya",
      points: 1284,
      winRate: 57.1,
      activeWinStreak: 3,
      totalPosts: 140,
      bio: "",
      plan: "pro",
    },
  },
];

function buildMySquad(state: SquadBattlePreviewState): Squad | null {
  if (state === "none") return null;

  const members =
    state === "full"
      ? padMembers(MY_MEMBERS_FULL)
      : padMembers(MY_MEMBERS_RECRUITING);

  return {
    id: "sq-mine",
    name: "NEON CIRCUIT",
    members,
    avgPoints: avgOf(members),
    rank: 0,
    // 満員時は上昇、募集中は微下降になるよう前回順位をずらす
    prevRank: state === "full" ? 8 : 4,
    isMine: true,
    // 募集中のみ招待コードを発行
    inviteCode: state === "recruiting" ? SQUAD_BATTLE_MOCK_INVITE_CODE : null,
    avgPointsDayDelta: state === "full" ? 36 : 18,
  };
}

function rankLeaderboard(squads: Squad[]): Squad[] {
  const sorted = [...squads].sort((a, b) => b.avgPoints - a.avgPoints);
  return sorted.map((s, i) => ({
    ...s,
    rank: i + 1,
    // prevRank は入力のまま残す（未設定なら現在順位＝変動なし）
    prevRank: s.prevRank ?? i + 1,
  }));
}

/** 過去スクワッド再招集プレビュー用 */
export type PastSquadHistoryMock = {
  battleId: string;
  battleName: string;
  squadId: string;
  squadName: string;
  role: "owner" | "member";
  members: Array<{
    uid: string;
    displayName: string;
    handle: string | null;
    plan?: "free" | "pro";
  }>;
};

/** 受信した再招集招待（プレビュー） */
export type SquadInviteMemberSummary = {
  uid: string;
  displayName: string;
  handle: string | null;
  plan?: "free" | "pro";
  photoURL?: string | null;
};

export type SquadIncomingInviteMock = {
  id: string;
  squadId: string;
  squadName: string;
  fromDisplayName: string;
  fromHandle?: string | null;
  deadlineLabel?: string;
  members?: SquadInviteMemberSummary[];
};

function seedFromUid(uid: string): number {
  let seed = 0;
  for (let i = 0; i < uid.length; i += 1) {
    seed += uid.charCodeAt(i);
  }
  return seed;
}

/** 招待メンバー → プロフィール要約（成績プレビュー用） */
export function squadInviteMemberToProfile(
  member: SquadInviteMemberSummary
): SquadApplicantProfile {
  const seed = seedFromUid(member.uid);
  const points = 980 + (seed % 420);
  return {
    uid: member.uid,
    handle: member.handle ?? "",
    displayName: member.displayName,
    points,
    winRate: Math.round((48 + (seed % 17)) * 10) / 10,
    activeWinStreak: seed % 6,
    totalPosts: 40 + (seed % 90),
    bio: `${member.displayName} のプロフィール（プレビュー）。`,
    plan: member.plan,
    photoURL: member.photoURL,
    ...mockPeriodRanks(points),
  };
}

/** 招待カードのメンバー成績。招待に無いときは公開スクワッド一覧から補う */
export function squadIncomingInviteMemberProfiles(
  invite: Pick<SquadIncomingInviteMock, "squadId" | "members">,
  openSquads: OpenSquadListing[] = []
): SquadApplicantProfile[] {
  if (invite.members && invite.members.length > 0) {
    return invite.members.map(squadInviteMemberToProfile);
  }
  return openSquads.find((s) => s.id === invite.squadId)?.members ?? [];
}

const PREVIEW_SELF_MEMBER: SquadMember = {
  uid: "me",
  handle: "kamiya",
  displayName: "Kamiya",
  points: 1284,
  plan: "pro",
};

/** 招待を受けたあと MY SQUAD に出すスクワッド（自分 + 招待メンバー + 空き枠） */
export function squadFromIncomingInvite(
  invite: SquadIncomingInviteMock,
  self: SquadMember = PREVIEW_SELF_MEMBER
): Squad {
  const others = (invite.members ?? []).map((m) => {
    const profile = squadInviteMemberToProfile(m);
    return {
      uid: m.uid,
      handle: m.handle ?? "",
      displayName: m.displayName,
      points: profile.points,
      plan: m.plan,
      photoURL: m.photoURL,
    } satisfies SquadMember;
  });
  const withoutSelf = others.filter((m) => m.uid !== self.uid);
  const members = padMembers([self, ...withoutSelf]);
  return {
    id: invite.squadId || "sq-joined",
    name: invite.squadName,
    members,
    avgPoints: avgOf(members),
    rank: 0,
    prevRank: 0,
    isMine: true,
    inviteCode: SQUAD_BATTLE_MOCK_INVITE_CODE,
    avgPointsDayDelta: 18,
  };
}

export type SquadBattleMockBundle = {
  state: SquadBattlePreviewState;
  mySquad: Squad | null;
  leaderboard: Squad[];
  /** 未参加時: 空き枠あり一覧 */
  openSquads: OpenSquadListing[];
  /** 未参加時: 自分が送った申請 */
  myOutgoingRequests: SquadJoinRequest[];
  /** 募集中: 自分のスクワッドへの申請 */
  incomingRequests: SquadJoinRequest[];
  /** 直近 locked スクワッド（再招集） */
  pastSquads: PastSquadHistoryMock[];
  /** 未参加時: 再招集招待 */
  incomingInvites: SquadIncomingInviteMock[];
};

const PAST_SQUAD_HISTORY: PastSquadHistoryMock[] = [
  {
    battleId: "gb-prev-1",
    battleName: "SQUAD BATTLE Nov",
    squadId: "past-squad-alpha",
    squadName: "NEON WOLVES",
    role: "owner",
    members: [
      { uid: "me", displayName: "Kamiya", handle: "kamiya", plan: "pro" },
      { uid: "u-rio", displayName: "Rio", handle: "rio_jp", plan: "pro" },
      { uid: "u-ken", displayName: "Ken", handle: "kenball", plan: "free" },
      { uid: "u-aya", displayName: "Aya", handle: "aya_shot", plan: "pro" },
    ],
  },
  {
    battleId: "gb-prev-2",
    battleName: "SQUAD BATTLE Sep",
    squadId: "past-squad-beta",
    squadName: "COURT KINGS",
    role: "member",
    members: [
      { uid: "u-max", displayName: "Max", handle: "maxout", plan: "pro" },
      { uid: "me", displayName: "Kamiya", handle: "kamiya", plan: "pro" },
      { uid: "u-leo", displayName: "Leo", handle: "leo_hz", plan: "free" },
    ],
  },
];

const INCOMING_SQUAD_INVITES: SquadIncomingInviteMock[] = [
  {
    id: "inv-1",
    squadId: "open-1",
    squadName: "NEON WOLVES",
    fromDisplayName: "Rio",
    fromHandle: "rio_jp",
    deadlineLabel: "8/10 23:59",
    members: [
      { uid: "u-rio", displayName: "Rio", handle: "rio_jp", plan: "pro" },
      { uid: "u-ken", displayName: "Ken", handle: "kenball", plan: "free" },
      { uid: "u-aya", displayName: "Aya", handle: "aya_shot", plan: "pro" },
    ],
  },
];

/** プレビュー状態に応じたモック一式 */
export function getSquadBattleMock(
  state: SquadBattlePreviewState
): SquadBattleMockBundle {
  const mySquad = buildMySquad(state);
  const others: Squad[] = BOARD_OTHERS.map((s) => ({
    ...s,
    rank: 0,
    isMine: false,
  }));

  const leaderboard = rankLeaderboard(
    mySquad ? [...others, { ...mySquad, rank: 0 }] : others
  );

  const rankedMine =
    mySquad == null
      ? null
      : (leaderboard.find((s) => s.isMine) ?? {
          ...mySquad,
          rank: leaderboard.length,
        });

  return {
    state,
    mySquad: rankedMine,
    leaderboard,
    openSquads: state === "none" ? OPEN_SQUAD_LISTINGS : [],
    myOutgoingRequests: state === "none" ? OUTGOING_JOIN_REQUESTS : [],
    incomingRequests: state === "recruiting" ? INCOMING_JOIN_REQUESTS : [],
    pastSquads: state === "none" || state === "recruiting" ? PAST_SQUAD_HISTORY : [],
    incomingInvites: state === "none" ? INCOMING_SQUAD_INVITES : [],
  };
}

/** 表示用: 得点をカンマ区切り */
export function formatSquadPoints(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** メンバー数（空き除く） */
export function countActiveMembers(squad: Squad): number {
  return squad.members.filter((m) => !m.empty).length;
}
