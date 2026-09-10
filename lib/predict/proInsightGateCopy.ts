/**
 * Free 向け Pro Insight ゲート文面（ReportGate の Insight 版）— 7言語。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type ProInsightGateLang = LocalizedLang;
export const resolveProInsightGateLang = resolveLocalizedLang;

export type ProInsightGateBulletIcon =
  | "matchup"
  | "schedule"
  | "context"
  | "edge"
  | "comment";

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
      ja: "マッチアップ・日程・文脈を左右比較で把握できます。",
      en: "Compare matchup, schedule, and context side by side.",
      ko: "매치업·일정·맥락을 좌우 비교로 파악하세요.",
      zh: "左右对比查看对位、赛程与比赛语境。",
      es: "Compara emparejamiento, calendario y contexto lado a lado.",
      pt: "Compare confronto, agenda e contexto lado a lado.",
      fr: "Comparez confrontation, calendrier et contexte côte à côte.",
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
          ja: "相性とエッジをホーム／アウェイで比較",
          en: "Edges and fit for home vs away",
          ko: "홈/원정 상성과 엣지 비교",
          zh: "主客场契合度与优势对比",
          es: "Ventajas y encaje local vs visitante",
          pt: "Vantagens e encaixe mandante vs visitante",
          fr: "Avantages et fit domicile vs extérieur",
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
          ja: "連戦・休養・移動の負荷が一目でわかる",
          en: "Back-to-backs, rest, and travel load",
          ko: "연전·휴식·이동 부하를 한눈에",
          zh: "连战、休息与旅途负荷一目了然",
          es: "Back-to-backs, descanso y carga de viaje",
          pt: "Jogos seguidos, descanso e carga de viagem",
          fr: "Back-to-backs, repos et charge de voyage",
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
          ja: "直近フォームと試合の文脈",
          en: "Recent form and game situation",
          ko: "최근 폼과 경기 상황",
          zh: "近期状态与比赛情境",
          es: "Forma reciente y situación del partido",
          pt: "Forma recente e situação do jogo",
          fr: "Forme récente et situation de match",
        }),
      },
      {
        icon: "edge",
        title: L(lang, {
          ja: "有利不利",
          en: "Who has the edge",
          ko: "유리·불리",
          zh: "谁更有优势",
          es: "Quién tiene la ventaja",
          pt: "Quem tem a vantagem",
          fr: "Qui a l’avantage",
        }),
        detail: L(lang, {
          ja: "どちらが相手の弱点を突けるか",
          en: "Who can exploit the other’s weak spots",
          ko: "누가 상대 약점을 공략할 수 있는지",
          zh: "谁更能打穿对方弱点",
          es: "Quién puede explotar las debilidades del rival",
          pt: "Quem pode explorar os pontos fracos do rival",
          fr: "Qui peut exploiter les faiblesses de l’autre",
        }),
      },
      {
        icon: "comment",
        title: L(lang, {
          ja: "プレイヤー",
          en: "Players",
          ko: "플레이어",
          zh: "球员",
          es: "Jugadores",
          pt: "Jogadores",
          fr: "Joueurs",
        }),
        detail: L(lang, {
          ja: "型×相手穴・直近フォームの選手読み",
          en: "Fit vs opponent holes · last-10 form",
          ko: "유형×상대 구멍·최근 폼 선수 읽기",
          zh: "风格×对手漏洞·近 10 场状态解读",
          es: "Encaje vs huecos rivales · forma last-10",
          pt: "Encaixe vs buracos rivais · forma last-10",
          fr: "Fit vs trous adverses · forme last-10",
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
