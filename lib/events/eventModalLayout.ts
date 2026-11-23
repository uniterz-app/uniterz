import {
  DECEMBER_2026_CHRISTMAS_NOTICE_ID,
  DECEMBER_2026_CUP_NOTICE_ID,
  DECEMBER_2026_MONTHLY_NOTICE_ID,
} from "../campaigns/december2026Campaign";

export type EventModalPrizeKind = "mega-box" | "ballers" | "packs" | "tee";

export type EventModalPrizeRow = {
  place: 1 | 2 | 3;
  kind: EventModalPrizeKind;
  labelJa: string;
  labelEn: string;
  hintJa: string;
  hintEn: string;
};

export type EventModalLayout = {
  kickerJa: string;
  kickerEn: string;
  titleJa: string;
  titleEn: string;
  ruleJa: string;
  ruleEn: string;
  targetJa: string;
  targetEn: string;
  footerJa: string;
  footerEn: string;
  prizes: EventModalPrizeRow[];
};

const MONTHLY: EventModalLayout = {
  kickerJa: "EVENT",
  kickerEn: "EVENT",
  titleJa: "12月 月間ランキング",
  titleEn: "December Monthly",
  ruleJa: "ピックアップのスコア · 全員",
  ruleEn: "Pickup score · everyone",
  targetJa: "対象：12月のピックアップ試合",
  targetEn: "December Pickup games",
  footerJa: "Unit はいつもどおり配布。賞品はメールで連絡します",
  footerEn: "Units as usual. Prizes emailed",
  prizes: [
    {
      place: 1,
      kind: "mega-box",
      labelJa: "Mega Mystery Box",
      labelEn: "Mega Mystery Box",
      hintJa: "Toops の Mega Box",
      hintEn: "Toops Mega Box",
    },
    {
      place: 2,
      kind: "ballers",
      labelJa: "Ballers ×2",
      labelEn: "Ballers ×2",
      hintJa: "Toops のミニフィギュア",
      hintEn: "Toops mini figures",
    },
    {
      place: 3,
      kind: "packs",
      labelJa: "Mega パック ×5",
      labelEn: "Mega packs ×5",
      hintJa: "Toops Mega Box のパック",
      hintEn: "Packs from a Toops Mega Box",
    },
  ],
};

const CUP: EventModalLayout = {
  kickerJa: "EVENT",
  kickerEn: "EVENT",
  titleJa: "NBAカップ ノックアウト",
  titleEn: "NBA Cup Knockout",
  ruleJa: "ノックアウトステージのスコア · 全員",
  ruleEn: "Knockout stage score · everyone",
  targetJa: "対象：ノックアウトステージ全7試合",
  targetEn: "All 7 knockout-stage games",
  footerJa: "賞品は登録メールで連絡します",
  footerEn: "Winners are emailed",
  prizes: [
    {
      place: 1,
      kind: "tee",
      labelJa: "優勝チームのTシャツ",
      labelEn: "Championship team tee",
      hintJa: "NBAカップ優勝チーム",
      hintEn: "NBA Cup champion",
    },
    {
      place: 2,
      kind: "ballers",
      labelJa: "Ballers ×2",
      labelEn: "Ballers ×2",
      hintJa: "Toops のミニフィギュア",
      hintEn: "Toops mini figures",
    },
    {
      place: 3,
      kind: "packs",
      labelJa: "Mega パック ×3",
      labelEn: "Mega packs ×3",
      hintJa: "Toops Mega Box のパック",
      hintEn: "Packs from a Toops Mega Box",
    },
  ],
};

const CHRISTMAS: EventModalLayout = {
  kickerJa: "EVENT",
  kickerEn: "EVENT",
  titleJa: "クリスマス",
  titleEn: "Christmas",
  ruleJa: "クリスマスゲームのスコア · 全員",
  ruleEn: "Christmas games score · everyone",
  targetJa: "対象：クリスマスゲームすべて",
  targetEn: "All Christmas games",
  footerJa: "賞品は登録メールで連絡します",
  footerEn: "Winners are emailed",
  prizes: [
    {
      place: 1,
      kind: "ballers",
      labelJa: "Ballers ×3",
      labelEn: "Ballers ×3",
      hintJa: "Toops のミニフィギュア · 1位のみ",
      hintEn: "Toops mini figures · 1st only",
    },
  ],
};

const BY_ID: Record<string, EventModalLayout> = {
  [DECEMBER_2026_MONTHLY_NOTICE_ID]: MONTHLY,
  [DECEMBER_2026_CUP_NOTICE_ID]: CUP,
  [DECEMBER_2026_CHRISTMAS_NOTICE_ID]: CHRISTMAS,
};

export function eventModalLayoutFor(id: string): EventModalLayout | null {
  return BY_ID[id] ?? null;
}
