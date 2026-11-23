/** ASK を初めて開いたときの説明。無料のスタッツ回数は `nbaAskQuota` と揃える（3）。 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function nbaAskIntroCopy(language: string | null | undefined): {
  eyebrow: string;
  title: string;
  appLabel: string;
  appBody: string;
  statsLabel: string;
  statsBody: string;
  limitBody: string;
  note: string;
  cta: string;
} {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "ASK",
    title: L(lang, {
      ja: "アプリとスタッツに聞ける画面",
      en: "Ask about the app and stats",
      zh: "可问应用和数据",
      ko: "앱과 스탯을 묻는 화면",
      es: "Pregunta por la app y las stats",
      de: "Fragen zur App und zu Stats",
      fr: "Questions sur l’app et les stats",
      ar: "اسأل عن التطبيق والإحصائيات",
      pt: "Pergunte sobre o app e as stats",
    }),
    appLabel: L(lang, {
      ja: "アプリ",
      en: "App",
      zh: "应用",
      ko: "앱",
      es: "App",
      de: "App",
      fr: "App",
      ar: "التطبيق",
      pt: "App",
    }),
    appBody: L(lang, {
      ja: "使い方の質問。回数の制限はない。",
      en: "How the app works. No daily limit.",
      zh: "问用法。没有次数上限。",
      ko: "사용법 질문. 횟수 제한 없음.",
      es: "Cómo usar la app. Sin límite diario.",
      de: "Fragen zur Bedienung. Kein Tageslimit.",
      fr: "Comment marche l’app. Pas de limite quotidienne.",
      ar: "أسئلة عن الاستخدام. بلا حد يومي.",
      pt: "Como usar o app. Sem limite diário.",
    }),
    statsLabel: L(lang, {
      ja: "スタッツ",
      en: "Stats",
      zh: "数据",
      ko: "스탯",
      es: "Stats",
      de: "Stats",
      fr: "Stats",
      ar: "إحصائيات",
      pt: "Stats",
    }),
    statsBody: L(lang, {
      ja: "NBA の数字。無料は 1 日 3 回（日本時間 0 時に戻る）。PRO は無制限。",
      en: "NBA numbers. Free: 3 per day (resets midnight JST). Unlimited on PRO.",
      zh: "NBA 数据。免费每天 3 次（日本时间 0 点恢复）。PRO 不限次数。",
      ko: "NBA 숫자. 무료는 하루 3회(일본 시간 0시에 리셋). PRO는 무제한.",
      es: "Números NBA. Gratis: 3 al día (vuelve a medianoche JST). Ilimitado con PRO.",
      de: "NBA-Zahlen. Free: 3 pro Tag (Mitternacht JST). Unbegrenzt mit PRO.",
      fr: "Chiffres NBA. Gratuit : 3 / jour (minuit JST). Illimité avec PRO.",
      ar: "أرقام الـ NBA. المجاني 3 يوميًا (تُعاد منتصف الليل بتوقيت اليابان). بلا حد مع PRO.",
      pt: "Números da NBA. Grátis: 3 por dia (volta à meia-noite JST). Ilimitado no PRO.",
    }),
    limitBody: L(lang, {
      ja: "ニュースやトレードの噂は調べられない。答えはアプリのデータから。",
      en: "It can’t look up news or trade rumors. Answers come from the app’s data.",
      zh: "查不了新闻或交易传闻。答案只来自应用里的数据。",
      ko: "뉴스나 트레이드 소문은 찾지 않음. 답은 앱 데이터에서만.",
      es: "No busca noticias ni rumores de traspasos. Las respuestas salen de los datos de la app.",
      de: "Keine News und keine Trade-Gerüchte. Antworten kommen aus App-Daten.",
      fr: "Pas de news ni de rumeurs de transfert. Les réponses viennent des données de l’app.",
      ar: "لا يبحث عن الأخبار أو شائعات الصفقات. الإجابات من بيانات التطبيق فقط.",
      pt: "Não busca notícias nem rumores de trade. As respostas vêm dos dados do app.",
    }),
    note: L(lang, {
      ja: "試合の日程は回数に入らない。",
      en: "Game schedule questions don’t count toward the daily limit.",
      zh: "赛程提问不计入每日次数。",
      ko: "경기 일정 질문은 횟수에 안 들어감.",
      es: "El calendario no cuenta en el límite diario.",
      de: "Spielplan zählt nicht zum Tageslimit.",
      fr: "Le calendrier ne compte pas dans la limite.",
      ar: "أسئلة الجدول لا تُحسب ضمن الحد اليومي.",
      pt: "O calendário não conta no limite diário.",
    }),
    cta: L(lang, {
      ja: "聞く",
      en: "Ask",
      zh: "去问",
      ko: "묻기",
      es: "Preguntar",
      de: "Fragen",
      fr: "Demander",
      ar: "اسأل",
      pt: "Perguntar",
    }),
  };
}
