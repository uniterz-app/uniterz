/**
 * 2026年12月チャレンジ（月間 / NBAカップKO / クリスマス）。
 * 指標はピックアップのスコア。対象は全員。
 * アプリ内モーダルはイベントごとに分け、期間外は出さない。
 */
import type { EventNoticeContent } from "../events/eventNoticeTypes";
import { TIMEZONE_JST, zonedTimeToUtcMs } from "../time/zonedTime";

function jstMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): number {
  return zonedTimeToUtcMs({
    year,
    month,
    day,
    hour,
    minute,
    second: 0,
    timeZone: TIMEZONE_JST,
  });
}

export const DECEMBER_2026_MONTH_KEY = "2026-12";
export const DECEMBER_2026_CHRISTMAS_ET_DATE = "2026-12-25";
export const DECEMBER_2026_COSTS_DOC = "challengeMetrics/december-2026";

/** 1枚まとめ（廃止）。Firestore に残っていれば非表示にする */
export const DECEMBER_2026_COMBO_NOTICE_ID = "nba-2026-12-prizes";

export const DECEMBER_2026_MONTHLY_NOTICE_ID = "nba-2026-12-monthly";
export const DECEMBER_2026_CUP_NOTICE_ID = "nba-2026-12-cup";
export const DECEMBER_2026_CHRISTMAS_NOTICE_ID = "nba-2026-12-christmas";

/** 管理画面の掲載ボタンはいま月間だけ */
export const DECEMBER_2026_CAMPAIGN_ID = DECEMBER_2026_MONTHLY_NOTICE_ID;

const SHARED_FOOTER_JA = "賞品は登録メールでご連絡します。";
const SHARED_FOOTER_EN = "Winners are contacted at the email on their account.";
const MONTHLY_UNITS_JA = "Unit はいつもどおり順位で配布します。賞品は上位3名への追加です。";
const MONTHLY_UNITS_EN =
  "Units still pay out by rank as usual. Merch is extra for the top 3.";
const SHARED_SCORE_JA = "ピックアップのスコアで競います。対象は全員です。";
const SHARED_SCORE_EN = "Scored with Pickup points. Open to everyone.";

export const DECEMBER_2026_MONTHLY_BODY_JA = `${SHARED_SCORE_JA}

対象：12月のピックアップ試合
1位　NBA Mega Mystery Box
2位　NBA Ballers ×2
3位　NBA Mega Mystery Box パック ×5

${MONTHLY_UNITS_JA}
${SHARED_FOOTER_JA}`;

export const DECEMBER_2026_MONTHLY_BODY_EN = `${SHARED_SCORE_EN}

Games: December Pickup games
1st  NBA Mega Mystery Box
2nd  NBA Ballers ×2
3rd  NBA Mega Mystery Box packs ×5

${MONTHLY_UNITS_EN}
${SHARED_FOOTER_EN}`;

export const DECEMBER_2026_CUP_BODY_JA = `ノックアウトステージのスコアで競います。対象は全員です。

対象：NBAカップのノックアウトステージ全7試合
1位　優勝チームのTシャツ
2位　NBA Ballers ×2
3位　NBA Mega Mystery Box パック ×3

${SHARED_FOOTER_JA}`;

export const DECEMBER_2026_CUP_BODY_EN = `Scored with knockout-stage points. Open to everyone.

Games: all 7 NBA Cup knockout-stage games
1st  Championship team T-shirt
2nd  NBA Ballers ×2
3rd  NBA Mega Mystery Box packs ×3

${SHARED_FOOTER_EN}`;

export const DECEMBER_2026_CHRISTMAS_BODY_JA = `クリスマスゲームのスコアで競います。対象は全員です。

対象：クリスマスゲームすべて
1位のみ　NBA Ballers ×3

${SHARED_FOOTER_JA}`;

export const DECEMBER_2026_CHRISTMAS_BODY_EN = `Scored with Christmas-game points. Open to everyone.

Games: all Christmas games
1st only  NBA Ballers ×3

${SHARED_FOOTER_EN}`;

/** 管理画面・YouTube / X 用（3イベントまとめた文面） */
export const DECEMBER_2026_NOTICE_TITLE_JA = "12月 月間ランキング";
export const DECEMBER_2026_NOTICE_BODY_JA = DECEMBER_2026_MONTHLY_BODY_JA;

export const DECEMBER_2026_X_COPY_JA = `UNITERZ 12月チャレンジ
指標はピックアップのスコア。対象は全員。

月間
1位 Mega Mystery Box / 2位 Ballers×2 / 3位 パック×5

NBAカップ ノックアウト（ノックアウトステージ全7試合）
1位 優勝チームのTシャツ / 2位 Ballers×2 / 3位 パック×3

クリスマス（クリスマスゲームすべて）
1位のみ Ballers×3`;

export const DECEMBER_2026_YOUTUBE_COPY_JA = `UNITERZ の12月チャレンジ、賞品が決まりました。

指標はいつもどおりピックアップのスコアです。対象は全員です。

月間ランキング（12月のピックアップ）
1位 NBA Mega Mystery Box
2位 NBA Ballers 2個
3位 Mega Mystery Box のパック 5個

NBAカップのノックアウト（ノックアウトステージ全7試合）
1位 優勝チームのTシャツ
2位 NBA Ballers 2個
3位 Mega Mystery Box のパック 3個

クリスマス（クリスマスゲームすべて）
1位だけ NBA Ballers 3個

詳しくはアプリ内お知らせを見てください。賞品は登録メールで連絡します。`;

const noticeBase = {
  tag: "イベント",
  tagEn: "Event",
  /** まだ出さない。出すときは true に戻して Firestore 掲載 */
  listInAnnouncements: false,
  showModal: false,
  pinned: true,
  heroImageURL: "",
} as const;

/** 11/22 0:00 JST 〜 12/4 0:00 JST（12/3まで） */
export const DECEMBER_2026_MONTHLY_NOTICE: EventNoticeContent = {
  ...noticeBase,
  id: DECEMBER_2026_MONTHLY_NOTICE_ID,
  title: "12月 月間ランキング",
  titleEn: "December monthly ranking",
  description: DECEMBER_2026_MONTHLY_BODY_JA,
  descriptionEn: DECEMBER_2026_MONTHLY_BODY_EN,
  period: "2026年12月（〜12/3 まで案内）",
  periodEn: "December 2026 (notice through Dec 3)",
  target: "12月のピックアップ試合・全員",
  targetEn: "December Pickup games · everyone",
  reward: "1位 Mega Box / 2位 Ballers×2 / 3位 パック×5",
  rewardEn: "1st Mega Box / 2nd Ballers×2 / 3rd packs×5",
  postedAtMs: jstMs(2026, 11, 22, 18, 0),
  visibleFromMs: jstMs(2026, 11, 22),
  visibleUntilMs: jstMs(2026, 12, 4),
};

/** 12/4 0:00 JST 〜 12/13 0:00 JST（ノックアウト期間） */
export const DECEMBER_2026_CUP_NOTICE: EventNoticeContent = {
  ...noticeBase,
  id: DECEMBER_2026_CUP_NOTICE_ID,
  title: "NBAカップ ノックアウト",
  titleEn: "NBA Cup knockout",
  description: DECEMBER_2026_CUP_BODY_JA,
  descriptionEn: DECEMBER_2026_CUP_BODY_EN,
  period: "ノックアウトステージ全7試合",
  periodEn: "All 7 knockout-stage games",
  target: "ノックアウトステージ全7試合・全員",
  targetEn: "All 7 knockout-stage games · everyone",
  reward: "1位 優勝チームのTシャツ / 2位 Ballers×2 / 3位 パック×3",
  rewardEn: "1st championship tee / 2nd Ballers×2 / 3rd packs×3",
  postedAtMs: jstMs(2026, 12, 4),
  visibleFromMs: jstMs(2026, 12, 4),
  visibleUntilMs: jstMs(2026, 12, 13),
};

/** 12/20 0:00 JST 〜 12/26 0:00 JST */
export const DECEMBER_2026_CHRISTMAS_NOTICE: EventNoticeContent = {
  ...noticeBase,
  id: DECEMBER_2026_CHRISTMAS_NOTICE_ID,
  title: "クリスマス",
  titleEn: "Christmas",
  description: DECEMBER_2026_CHRISTMAS_BODY_JA,
  descriptionEn: DECEMBER_2026_CHRISTMAS_BODY_EN,
  period: "クリスマスゲームすべて",
  periodEn: "All Christmas games",
  target: "クリスマスゲームすべて・全員",
  targetEn: "All Christmas games · everyone",
  reward: "1位のみ Ballers×3",
  rewardEn: "1st only Ballers×3",
  postedAtMs: jstMs(2026, 12, 20),
  visibleFromMs: jstMs(2026, 12, 20),
  visibleUntilMs: jstMs(2026, 12, 26),
};

export const DECEMBER_2026_EVENT_NOTICES: readonly EventNoticeContent[] = [
  DECEMBER_2026_MONTHLY_NOTICE,
  DECEMBER_2026_CUP_NOTICE,
  DECEMBER_2026_CHRISTMAS_NOTICE,
];

export type December2026PhysicalCounts = {
  megaBox: number;
  ballers: number;
  megaPacks: number;
  tee: number;
};

export type December2026PlannedPhysical = {
  monthly: December2026PhysicalCounts;
  cup: December2026PhysicalCounts;
  christmas: December2026PhysicalCounts;
  totals: December2026PhysicalCounts;
};

/** 現物の予定個数（実費の円は管理画面で入れる） */
export const DECEMBER_2026_PLANNED_PHYSICAL: December2026PlannedPhysical = {
  monthly: { megaBox: 1, ballers: 2, megaPacks: 5, tee: 0 },
  cup: { megaBox: 0, ballers: 2, megaPacks: 3, tee: 1 },
  christmas: { megaBox: 0, ballers: 3, megaPacks: 0, tee: 0 },
  totals: { megaBox: 1, ballers: 7, megaPacks: 8, tee: 1 },
};

export type December2026CostInputs = {
  megaBoxYen: number;
  megaPackYen: number;
  ballersYen: number;
  teeYen: number;
  shippingYen: number;
  otherYen: number;
  admobYenActual: number;
  unitYenPerUnit: number;
  notes: string;
};

export const DECEMBER_2026_COST_DEFAULTS: December2026CostInputs = {
  megaBoxYen: 0,
  megaPackYen: 0,
  ballersYen: 0,
  teeYen: 0,
  shippingYen: 0,
  otherYen: 0,
  admobYenActual: 0,
  unitYenPerUnit: 0,
  notes: "",
};

export function parseDecember2026CostInputs(
  raw: Record<string, unknown> | null | undefined
): December2026CostInputs {
  const n = (k: keyof December2026CostInputs): number => {
    const v = raw?.[k];
    const num = typeof v === "number" ? v : Number(v);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };
  return {
    megaBoxYen: n("megaBoxYen"),
    megaPackYen: n("megaPackYen"),
    ballersYen: n("ballersYen"),
    teeYen: n("teeYen"),
    shippingYen: n("shippingYen"),
    otherYen: n("otherYen"),
    admobYenActual: n("admobYenActual"),
    unitYenPerUnit: n("unitYenPerUnit"),
    notes: typeof raw?.notes === "string" ? raw.notes : "",
  };
}

export function physicalCostYen(costs: December2026CostInputs): number {
  const t = DECEMBER_2026_PLANNED_PHYSICAL.totals;
  return (
    t.megaBox * costs.megaBoxYen +
    t.megaPacks * costs.megaPackYen +
    t.ballers * costs.ballersYen +
    t.tee * costs.teeYen +
    costs.shippingYen +
    costs.otherYen
  );
}
