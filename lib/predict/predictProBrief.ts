/**
 * Pro Prediction Brief — HOME / AWAY
 * MATCHUP · SCHEDULE · CONTEXT · PLAYERS
 * 推奨スコア / KEY / 共有Risk は出さない。
 */

import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

export type ProBriefEdgeItem = {
  /** 英語ラベル必須（UI は常に英語） */
  label: string;
  /** 任意の裏付け（言語切替） */
  detailJa?: string;
  detailEn?: string;
  /** 7言語版。旧データには無いので任意 */
  detail?: UiStrings;
};

export type ProBriefLineItem = {
  textJa: string;
  textEn: string;
  /** 7言語版。旧データには無いので任意 */
  text?: UiStrings;
};

/** 選手単位の読み（型×相手穴 / 直近フォーム） */
export type ProBriefPlayerItem = {
  playerId?: string;
  playerName: string;
  /** 英語ラベル（PAINT EDGE / HOT 3PT など） */
  label: string;
  detailJa: string;
  detailEn: string;
  /** 7言語版。旧データには無いので任意 */
  detail?: UiStrings;
};

/** UiStrings から ja/en 併記の line item を作る（Firestore 互換のため両方持つ） */
export function proBriefLine(text: UiStrings): ProBriefLineItem {
  return { textJa: text.ja, textEn: text.en, text };
}

/** UiStrings から ja/en 併記の edge item を作る */
export function proBriefEdge(
  label: string,
  detail: UiStrings
): ProBriefEdgeItem {
  return { label, detailJa: detail.ja, detailEn: detail.en, detail };
}

/** UiStrings から ja/en 併記の player item を作る */
export function proBriefPlayer(
  base: Pick<ProBriefPlayerItem, "playerId" | "playerName" | "label">,
  detail: UiStrings
): ProBriefPlayerItem {
  return {
    ...base,
    detailJa: detail.ja,
    detailEn: detail.en,
    detail,
  };
}

export type ProBriefTeamCard = {
  edges: ProBriefEdgeItem[];
  /** 日程・疲労（目安 2） */
  schedule: ProBriefLineItem[];
  /** 直近対戦相手の強さなど */
  context: ProBriefLineItem[];
  /** 選手インサイト（目安 1〜2） */
  players?: ProBriefPlayerItem[];
};

/** シーズン進行に応じた生成モード（設計: docs/pro-insight-design.md） */
export type ProBriefPhase = "opening" | "early" | "full";

export type PredictProBrief = {
  home: ProBriefTeamCard;
  away: ProBriefTeamCard;
  /** opening / early / full */
  phase?: ProBriefPhase;
  /** early のみ。カード全体に 1 回出すサンプル注記 */
  sampleNoteJa?: string;
  sampleNoteEn?: string;
  /** 7言語版。旧データには無いので任意 */
  sampleNote?: UiStrings;
  /** 消化済み試合数（early の N） */
  gamesPlayed?: number;
  generatedAtMs?: number;
  patchedAtMs?: number;
};

export function briefEdgeDetail(
  edge: ProBriefEdgeItem,
  language: string | null | undefined
): string | undefined {
  const lang = resolveLocalizedLang(language);
  if (edge.detail) return L(lang, edge.detail);
  // 7言語版が無い旧データは ja/en のみ。非 ja は en にフォールバック。
  return lang === "ja" ? edge.detailJa : edge.detailEn;
}

export function briefLineText(
  item: ProBriefLineItem,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (item.text) return L(lang, item.text);
  return lang === "ja" ? item.textJa : item.textEn;
}

export function briefPlayerDetail(
  item: ProBriefPlayerItem,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (item.detail) return L(lang, item.detail);
  return lang === "ja" ? item.detailJa : item.detailEn;
}

export function briefSampleNote(
  brief: Pick<PredictProBrief, "sampleNoteJa" | "sampleNoteEn" | "sampleNote">,
  language: string | null | undefined
): string | undefined {
  const lang = resolveLocalizedLang(language);
  if (brief.sampleNote) return L(lang, brief.sampleNote);
  if (lang === "ja") {
    return brief.sampleNoteJa ?? brief.sampleNoteEn;
  }
  return brief.sampleNoteEn ?? brief.sampleNoteJa;
}

/** 「開幕戦 · 休養十分」→ 見出し + 本文。区切りが無ければ本文のみ */
export function splitBriefLineLead(text: string): {
  label: string | null;
  body: string;
} {
  for (const sep of [" · ", "・"] as const) {
    const i = text.indexOf(sep);
    if (i <= 0) continue;
    const label = text.slice(0, i).trim();
    const body = text.slice(i + sep.length).trim();
    if (label && body) return { label, body };
  }
  return { label: null, body: text };
}
