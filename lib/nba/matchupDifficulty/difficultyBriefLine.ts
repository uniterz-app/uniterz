/**
 * Pro Insight SCHEDULE — Matchup Difficulty の数字と内訳（相手の強さ → 会場 → 休養）。
 * 内訳は upcoming 行の base / afterVenue / value の差分なので合計は必ず value に一致する。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import { proBriefLine, type ProBriefLineItem } from "@/lib/predict/predictProBrief";
import type { ProInsightNarrativeItem } from "@/lib/predict/proInsightNarrativeTypes";
import type { RestCategory } from "@/lib/nba/matchupDifficulty/features";
import type { NbaUpcomingMatchupDifficulty } from "@/lib/nba/matchupDifficulty/upcomingMatchupDifficulty";

export type Lang = keyof UiStrings;
const LANGS: readonly Lang[] = ["ja", "en", "ko", "zh", "es", "pt", "fr", "de", "ar"];

const REST_ORDER: Record<RestCategory, number> = { "0": 0, "1": 1, "2": 2, "3+": 3 };

type Words = {
  label: string;
  opp: string;
  home: string;
  away: string;
  rest: string;
  early: string;
  b2b: string;
  oppB2b: string;
  moreRest: string;
  oppMoreRest: string;
};

const WORDS: Record<Lang, Words> = {
  ja: { label: "厳しさ", opp: "相手の強さ", home: "ホーム", away: "アウェイ", rest: "休養", early: "（序盤の目安）", b2b: "B2B", oppB2b: "相手B2B", moreRest: "休養で上回る", oppMoreRest: "相手の方が休養多め" },
  en: { label: "Difficulty", opp: "Opponent", home: "Home", away: "Road", rest: "Rest", early: "(early est.)", b2b: "B2B", oppB2b: "opp B2B", moreRest: "more rest", oppMoreRest: "opp more rested" },
  ko: { label: "난이도", opp: "상대 전력", home: "홈", away: "원정", rest: "휴식", early: "(초반 추정)", b2b: "백투백", oppB2b: "상대 백투백", moreRest: "휴식 우위", oppMoreRest: "상대가 더 휴식" },
  zh: { label: "难度", opp: "对手实力", home: "主场", away: "客场", rest: "休息", early: "（赛季初估算）", b2b: "背靠背", oppB2b: "对手背靠背", moreRest: "休息更充分", oppMoreRest: "对手休息更多" },
  es: { label: "Dificultad", opp: "Rival", home: "Local", away: "Visitante", rest: "Descanso", early: "(estimación)", b2b: "B2B", oppB2b: "rival en B2B", moreRest: "más descanso", oppMoreRest: "rival más descansado" },
  pt: { label: "Dificuldade", opp: "Adversário", home: "Casa", away: "Fora", rest: "Descanso", early: "(estimativa)", b2b: "B2B", oppB2b: "adversário em B2B", moreRest: "mais descanso", oppMoreRest: "adversário mais descansado" },
  fr: { label: "Difficulté", opp: "Adversaire", home: "Domicile", away: "Extérieur", rest: "Repos", early: "(estimation)", b2b: "B2B", oppB2b: "adversaire en B2B", moreRest: "plus de repos", oppMoreRest: "adversaire plus reposé" },
  de: { label: "Schwierigkeit", opp: "Gegner", home: "Heim", away: "Auswärts", rest: "Pause", early: "(Schätzung)", b2b: "B2B", oppB2b: "Gegner B2B", moreRest: "mehr Pause", oppMoreRest: "Gegner ausgeruhter" },
  ar: { label: "الصعوبة", opp: "قوة الخصم", home: "على أرضه", away: "خارج أرضه", rest: "الراحة", early: "(تقدير مبكر)", b2b: "B2B", oppB2b: "الخصم B2B", moreRest: "راحة أكثر", oppMoreRest: "الخصم أكثر راحة" },
};

export function isCjk(lang: Lang): boolean {
  return lang === "ja" || lang === "zh";
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0";
}

export function valueText(d: Pick<NbaUpcomingMatchupDifficulty, "value" | "lowSample">): string {
  return d.lowSample ? `~${d.value}` : String(d.value);
}

function restReason(own: RestCategory, opp: RestCategory, w: Words): string | null {
  if (own === "0" && opp !== "0") return w.b2b;
  if (opp === "0" && own !== "0") return w.oppB2b;
  if (REST_ORDER[own] > REST_ORDER[opp]) return w.moreRest;
  if (REST_ORDER[own] < REST_ORDER[opp]) return w.oppMoreRest;
  return null;
}

/** 「相手の強さ 58 / アウェイ +6 / 休養 +2（B2B）」の内訳部分 */
function breakdownParts(
  d: NbaUpcomingMatchupDifficulty,
  isHome: boolean,
  lang: Lang
): string[] {
  const w = WORDS[lang];
  const venueDelta = d.afterVenue - d.base;
  const restDelta = d.value - d.afterVenue;
  const parts = [`${w.opp} ${d.base}`, `${isHome ? w.home : w.away} ${signed(venueDelta)}`];
  if (restDelta !== 0) {
    const reason = restReason(d.ownRest, d.oppRest, w);
    const note = reason ? (isCjk(lang) ? `（${reason}）` : ` (${reason})`) : "";
    parts.push(`${w.rest} ${signed(restDelta)}${note}`);
  }
  return parts;
}

export function earlySuffix(lowSample: boolean, lang: Lang): string {
  if (!lowSample) return "";
  return `${isCjk(lang) ? "" : " "}${WORDS[lang].early}`;
}

export function byLang(build: (lang: Lang) => string): UiStrings {
  const out = {} as UiStrings;
  for (const lang of LANGS) out[lang] = build(lang);
  return out;
}

/** 旧 HOME/AWAY brief の SCHEDULE 先頭行 */
export function difficultyBriefLine(
  d: NbaUpcomingMatchupDifficulty,
  isHome: boolean
): ProBriefLineItem {
  return proBriefLine(
    byLang(
      (lang) =>
        `${WORDS[lang].label} ${valueText(d)} · ${breakdownParts(d, isHome, lang).join(" / ")}${earlySuffix(d.lowSample, lang)}`
    )
  );
}

export type ScheduleDifficultySide = {
  teamAbbr: string;
  isHome: boolean;
  difficulty: NbaUpcomingMatchupDifficulty;
};

/** ナラティブ SCHEDULE 先頭項目 — 負荷の重いチームから「BOS は厳しさ 71（相手の強さ 58 · アウェイ +5 · 休養 +8（B2B））。」 */
export function difficultyNarrativeItem(
  sides: ScheduleDifficultySide[]
): ProInsightNarrativeItem | null {
  const ordered = [...sides].sort((a, b) => b.difficulty.value - a.difficulty.value);
  if (ordered.length === 0) return null;
  const lowSample = ordered.some((s) => s.difficulty.lowSample);

  const sentence = (s: ScheduleDifficultySide, lang: Lang) => {
    const w = WORDS[lang];
    const inner = breakdownParts(s.difficulty, s.isHome, lang).join(" · ");
    const v = valueText(s.difficulty);
    if (lang === "ja") return `${s.teamAbbr} は${w.label} ${v}（${inner}）。`;
    if (lang === "zh") return `${s.teamAbbr} ${w.label} ${v}（${inner}）。`;
    return `${s.teamAbbr} ${w.label} ${v} (${inner}).`;
  };

  const body = byLang((lang) => {
    const text = ordered.map((s) => sentence(s, lang)).join(isCjk(lang) ? "" : " ");
    return `${text}${earlySuffix(lowSample, lang)}`.trim();
  });
  const evidence = ordered.map((s) => {
    const parts = breakdownParts(s.difficulty, s.isHome, "en");
    const line = `${s.teamAbbr} ${valueText(s.difficulty)} · ${parts.join(" · ")}`;
    return byLang(() => line);
  });
  return { body, evidence, template: "difficulty" };
}
