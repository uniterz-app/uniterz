/**
 * Pro Insight のシーズン進行フェーズ。
 * gamesPlayed = 今夜より前に消化した試合数（wins+losses）。
 */
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import type { UiStrings } from "@/lib/i18n/ui";

/** 今夜が 6 試合目以降 → full（gamesPlayed ≥ 5） */
export const PRO_INSIGHT_FULL_MIN_GAMES_PLAYED = 5;

export function resolveProBriefPhase(gamesPlayed: number): ProBriefPhase {
  const n = Math.max(0, Math.floor(gamesPlayed));
  if (n <= 0) return "opening";
  if (n < PRO_INSIGHT_FULL_MIN_GAMES_PLAYED) return "early";
  return "full";
}

/** early 注記。N = 消化済み試合数 */
export function proBriefSampleNote(gamesPlayed: number): {
  sampleNoteJa: string;
  sampleNoteEn: string;
  sampleNote: UiStrings;
} {
  const n = Math.max(1, Math.floor(gamesPlayed));
  const sampleNote: UiStrings = {
    ja: `※ 開幕${n}試合時点 · サンプル少 · 上振れの可能性あり`,
    en: `※ Through ${n} games · small sample · may regress`,
    ko: `※ ${n}경기 시점 · 표본 부족 · 변동 가능`,
    zh: `※ 赛季 ${n} 场时点 · 样本偏小 · 可能回落`,
    es: `※ Tras ${n} partidos · muestra pequeña · puede regresar`,
    pt: `※ Após ${n} jogos · amostra pequena · pode regredir`,
    fr: `※ Après ${n} matchs · échantillon réduit · peut régresser`,
  };
  return {
    sampleNoteJa: sampleNote.ja,
    sampleNoteEn: sampleNote.en,
    sampleNote,
  };
}

/** 試合開始何 ms 前からケガ反映パッチ対象か（T-1h） */
export const PRO_BRIEF_PATCH_BEFORE_TIP_MS = 1 * 60 * 60 * 1000;

/** パッチ窓: tip の 1h 前〜 tip（開始後は触らない） */
export function isWithinProBriefPatchWindow(
  tipAtMs: number,
  nowMs: number = Date.now()
): boolean {
  if (!Number.isFinite(tipAtMs) || tipAtMs <= 0) return false;
  const delta = tipAtMs - nowMs;
  return delta > 0 && delta <= PRO_BRIEF_PATCH_BEFORE_TIP_MS;
}
