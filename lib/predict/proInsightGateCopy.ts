/**
 * Free 向け Pro Insight ゲート文面（ReportGate の Insight 版）— 7言語。
 * UI 正: 試合1本 · MATCHUP2 / SCHEDULE2 / CONTEXT2 / INJURY IMPACT2。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type ProInsightGateLang = LocalizedLang;
export const resolveProInsightGateLang = resolveLocalizedLang;

export type ProInsightGateBulletIcon =
  | "matchup"
  | "schedule"
  | "context"
  | "injury";

export type ProInsightGateBullet = {
  icon: ProInsightGateBulletIcon;
  title: string;
  detail: string;
};

export type ProInsightGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: readonly ProInsightGateBullet[];
  cta: string;
  /** ゲート下に出す実画面サンプルの見出し */
  exampleLabel: string;
  proMemberAria: string;
};

export function proInsightGateCopy(
  language: string | null | undefined
): ProInsightGateCopy {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "PRO INSIGHT",
    title: L(lang, {
      ja: "試合の読み解きは PRO INSIGHT",
      en: "Match reads unlock with PRO INSIGHT",
      ko: "경기 읽기는 PRO INSIGHT",
      zh: "比赛解读尽在 PRO INSIGHT",
      es: "Las lecturas del partido con PRO INSIGHT",
      pt: "Leituras do jogo com PRO INSIGHT",
      fr: "Lectures de match avec PRO INSIGHT",
    }),
    body: L(lang, {
      ja: "マッチアップ・日程・文脈・欠場影響を、試合1本の短文で把握できます。",
      en: "Matchup, schedule, context, and injury impact — one short brief per game.",
      ko: "매치업·일정·맥락·결장 영향을 경기 1편의 짧은 글로 파악하세요.",
      zh: "用单场短文掌握对位、赛程、语境与伤停影响。",
      es: "Emparejamiento, calendario, contexto e impacto de bajas en un brief por partido.",
      pt: "Confronto, agenda, contexto e impacto de lesões em um brief por jogo.",
      fr: "Confrontation, calendrier, contexte et impact des absences — un brief par match.",
    }),
    bullets: [
      {
        icon: "matchup",
        title: L(lang, {
          ja: "マッチアップ",
          en: "Matchup",
          ko: "매치업",
          zh: "对位",
          es: "Emparejamiento",
          pt: "Confronto",
          fr: "Confrontation",
        }),
        detail: L(lang, {
          ja: "相性と有利／不利が短文でわかる",
          en: "Fit and who has the edge, in short lines",
          ko: "상성과 유리·불리를 짧은 글로",
          zh: "短文看清契合与有利／不利",
          es: "Encaje y ventaja en líneas cortas",
          pt: "Encaixe e vantagem em linhas curtas",
          fr: "Fit et avantage en lignes courtes",
        }),
      },
      {
        icon: "schedule",
        title: L(lang, {
          ja: "スケジュール",
          en: "Schedule",
          ko: "스케줄",
          zh: "赛程",
          es: "Calendario",
          pt: "Agenda",
          fr: "Calendrier",
        }),
        detail: L(lang, {
          ja: "連戦・休養・移動距離の負荷",
          en: "B2B, rest, and travel distance load",
          ko: "연전·휴식·이동 거리 부하",
          zh: "连战、休息与移动距离负荷",
          es: "B2B, descanso y distancia de viaje",
          pt: "B2B, descanso e distância de viagem",
          fr: "B2B, repos et distance de trajet",
        }),
      },
      {
        icon: "context",
        title: L(lang, {
          ja: "コンテキスト",
          en: "Context",
          ko: "컨텍스트",
          zh: "语境",
          es: "Contexto",
          pt: "Contexto",
          fr: "Contexte",
        }),
        detail: L(lang, {
          ja: "直近フォームと相手強度の文脈",
          en: "Recent form and opponent strength",
          ko: "최근 폼과 상대 강도 맥락",
          zh: "近况与对手强度语境",
          es: "Forma reciente y fuerza del rival",
          pt: "Forma recente e força do adversário",
          fr: "Forme récente et force de l’adversaire",
        }),
      },
      {
        icon: "injury",
        title: L(lang, {
          ja: "インジャリーインパクト",
          en: "Injury impact",
          ko: "부상 임팩트",
          zh: "伤停影响",
          es: "Impacto de bajas",
          pt: "Impacto de lesões",
          fr: "Impact des absences",
        }),
        detail: L(lang, {
          ja: "OUT／QUES と欠場時の成績",
          en: "OUT / QUES and when-out records",
          ko: "OUT·QUES와 결장 시 성적",
          zh: "OUT／QUES 与缺阵战绩",
          es: "OUT / QUES y récords sin él",
          pt: "OUT / QUES e recordes sem ele",
          fr: "OUT / QUES et bilans sans lui",
        }),
      },
    ],
    cta: "Explore Pro",
    exampleLabel: L(lang, {
      ja: "表示イメージ（例）",
      en: "What it looks like (example)",
      ko: "표시 이미지(예시)",
      zh: "显示示意（示例）",
      es: "Así se ve (ejemplo)",
      pt: "Como fica (exemplo)",
      fr: "À quoi ça ressemble (exemple)",
    }),
    proMemberAria: L(lang, {
      ja: "Pro会員",
      en: "Pro member",
      ko: "Pro 회원",
      zh: "Pro 会员",
      es: "Miembro Pro",
      pt: "Membro Pro",
      fr: "Membre Pro",
    }),
  };
}
