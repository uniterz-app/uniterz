/**
 * Pro Insight テンプレで共有する 7 言語の語句。
 * 「前季 / 今季」「ホーム / アウェイ」など、各行の頭に付く語。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import { joinUiStrings, mapUiStrings } from "@/lib/i18n/uiCompose";

/** opening は前季ベース、early / full は今季ベース */
export type InsightPhase = "prior" | "current";

export const PHASE_WORD: Record<InsightPhase, UiStrings> = {
  prior: {
    ja: "前季",
    en: "Last season",
    ko: "지난 시즌",
    zh: "上季",
    es: "Temp. pasada",
    pt: "Temp. passada",
    fr: "Saison dern.",
  },
  current: {
    ja: "今季",
    en: "This season",
    ko: "이번 시즌",
    zh: "本季",
    es: "Esta temp.",
    pt: "Esta temp.",
    fr: "Cette saison",
  },
};

/** 「ホーム / アウェイ」単体（会場名として） */
export const VENUE_WORD: Record<"home" | "away", UiStrings> = {
  home: {
    ja: "ホーム",
    en: "home",
    ko: "홈",
    zh: "主场",
    es: "en casa",
    pt: "em casa",
    fr: "à domicile",
  },
  away: {
    ja: "アウェイ",
    en: "road",
    ko: "원정",
    zh: "客场",
    es: "fuera",
    pt: "fora",
    fr: "à l'extérieur",
  },
};

export function venueWord(isHome: boolean): UiStrings {
  return isHome ? VENUE_WORD.home : VENUE_WORD.away;
}

/** 相手守備の穴（ランク表示の右側） */
export const OPP_DEFENSE_WORD: UiStrings = {
  ja: "相手守備",
  en: "Opp defense",
  ko: "상대 수비",
  zh: "对手防守",
  es: "Defensa rival",
  pt: "Defesa adv.",
  fr: "Défense adv.",
};

/** 「L.James が OUT」/「L.James 缺阵」 */
export function injuryStatusPhrase(name: string, isOut: boolean): UiStrings {
  return {
    ja: `${name} が ${isOut ? "OUT" : "Questionable"}`,
    en: `${name} ${isOut ? "OUT" : "QUES"}`,
    ko: `${name} ${isOut ? "결장" : "출전 불투명"}`,
    zh: `${name} ${isOut ? "缺阵" : "出战成疑"}`,
    es: `${name} ${isOut ? "fuera" : "en duda"}`,
    pt: `${name} ${isOut ? "fora" : "em dúvida"}`,
    fr: `${name} ${isOut ? "absent" : "incertain"}`,
  };
}

function venueParen(isHome: boolean | null): UiStrings | null {
  if (isHome == null) return null;
  return mapUiStrings(venueWord(isHome), (value) => `(${value})`);
}

/** 「前季 EAST 上位との対戦 (ホーム) 12-8」 */
export function vsConfTopLine(input: {
  phase: InsightPhase;
  conference: string;
  isHome: boolean | null;
  record: string;
}): UiStrings {
  const conf = input.conference;
  return joinUiStrings(
    [
      PHASE_WORD[input.phase],
      {
        ja: `${conf} 上位との対戦`,
        en: `vs ${conf} top-6`,
        ko: `${conf} 상위권 상대`,
        zh: `对阵 ${conf} 前六`,
        es: `vs top-6 ${conf}`,
        pt: `vs top-6 ${conf}`,
        fr: `vs top-6 ${conf}`,
      },
      venueParen(input.isHome),
      input.record,
    ],
    " "
  );
}

/** 「前季 勝率5割以上相手 12-8 (60%)」 */
export function vsOver500Line(input: {
  phase: InsightPhase;
  record: string;
  winPct: number | null;
}): UiStrings {
  return joinUiStrings(
    [
      PHASE_WORD[input.phase],
      {
        ja: "勝率5割以上相手",
        en: "vs .500+",
        ko: "승률 5할 이상 상대",
        zh: "对阵五成胜率以上",
        es: "vs equipos .500+",
        pt: "vs times .500+",
        fr: "vs équipes .500+",
      },
      input.record,
      input.winPct != null ? `(${input.winPct}%)` : null,
    ],
    " "
  );
}

/** 「前季 勝率5割未満相手 20-4 (83%)」 */
export function vsUnder500Line(input: {
  phase: InsightPhase;
  record: string;
  winPct: number | null;
}): UiStrings {
  return joinUiStrings(
    [
      PHASE_WORD[input.phase],
      {
        ja: "勝率5割未満相手",
        en: "vs sub-.500",
        ko: "승률 5할 미만 상대",
        zh: "对阵五成胜率以下",
        es: "vs equipos sub-.500",
        pt: "vs times abaixo de .500",
        fr: "vs équipes sous .500",
      },
      input.record,
      input.winPct != null ? `(${input.winPct}%)` : null,
    ],
    " "
  );
}
