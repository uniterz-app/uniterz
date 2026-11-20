/**
 * 初回の UNIT 案内の文言（9 言語）。
 * - 登録直後の 1 枚（通知の前）
 * - 最初の予想を投稿した直後
 * - ランキングの初回ヒント（UNIT の配り方）
 * 数字は配布表（periodRankingUnitRewards）から出す。文字列に直書きしない。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  PERIOD_RANKING_UNIT_OVERALL_METRIC,
  unitsForPeriodRankingRank,
} from "@/lib/units/periodRankingUnitRewards";

export function unitIntroCopy(language: string | null | undefined): {
  introTitle: string;
  introLines: readonly [string, string, string];
  introNext: string;
  firstPostTitle: string;
  firstPostBody: string;
  firstPostCta: string;
  firstPostClose: string;
  rankingsBody: string;
} {
  const lang = resolveLocalizedLang(language);
  const w = String(
    unitsForPeriodRankingRank("weekly", PERIOD_RANKING_UNIT_OVERALL_METRIC, 1) ?? 0
  );
  const m = String(
    unitsForPeriodRankingRank("monthly", PERIOD_RANKING_UNIT_OVERALL_METRIC, 1) ?? 0
  );

  return {
    introTitle: L(lang, {
      ja: "UNITERZ でできること",
      en: "What you can do in UNITERZ",
      zh: "在 UNITERZ 能做什么",
      ko: "UNITERZ에서 할 수 있는 것",
      es: "Lo que puedes hacer en UNITERZ",
      de: "Das kannst du in UNITERZ tun",
      fr: "Ce que vous pouvez faire sur UNITERZ",
      ar: "ما الذي يمكنك فعله في UNITERZ",
      pt: "O que você pode fazer no UNITERZ",
    }),
    introLines: [
      L(lang, {
        ja: "試合の勝敗とスコアを予想する",
        en: "Predict each game's winner and score",
        zh: "预测每场比赛的胜负和比分",
        ko: "경기의 승패와 점수를 예측한다",
        es: "Predice el ganador y el marcador de cada partido",
        de: "Sieger und Ergebnis jedes Spiels vorhersagen",
        fr: "Prédis le vainqueur et le score de chaque match",
        ar: "توقّع الفائز ونتيجة كل مباراة",
        pt: "Preveja o vencedor e o placar de cada jogo",
      }),
      L(lang, {
        ja: "予想のスコアで、ランキングの順位が決まる",
        en: "Your prediction score sets your ranking",
        zh: "预测分数决定你在排名中的位置",
        ko: "예측 점수로 랭킹 순위가 정해진다",
        es: "Tu puntuación de predicción determina tu posición",
        de: "Dein Tipp-Score bestimmt deine Platzierung",
        fr: "Ton score de prédiction détermine ton classement",
        ar: "نقاط توقعك تحدد ترتيبك",
        pt: "Sua pontuação de palpite define sua posição",
      }),
      L(lang, {
        ja: "上位に入ると UNIT がもらえ、グッズと交換できる",
        en: "Top ranks earn UNIT, which you can exchange for merch",
        zh: "排名靠前可获得 UNIT，并可兑换周边",
        ko: "상위권이면 UNIT을 받고 굿즈로 교환할 수 있다",
        es: "Los mejores puestos ganan UNIT, que puedes canjear por merchandising",
        de: "Top-Platzierungen erhalten UNIT, das du gegen Merch tauschen kannst",
        fr: "Les meilleurs classements gagnent des UNIT, échangeables contre du merch",
        ar: "الأعلى ترتيبًا يحصلون على UNIT، ويمكن استبداله بالمنتجات",
        pt: "Quem fica no topo ganha UNIT, que pode ser trocado por produtos",
      }),
    ],
    introNext: L(lang, {
      ja: "次へ",
      en: "Next",
      zh: "下一步",
      ko: "다음",
      es: "Siguiente",
      de: "Weiter",
      fr: "Suivant",
      ar: "التالي",
      pt: "Próximo",
    }),

    firstPostTitle: L(lang, {
      ja: "予想を投稿しました",
      en: "Prediction posted",
      zh: "预测已提交",
      ko: "예측을 올렸습니다",
      es: "Predicción publicada",
      de: "Tipp abgegeben",
      fr: "Prédiction publiée",
      ar: "تم نشر التوقع",
      pt: "Palpite publicado",
    }),
    firstPostBody: L(lang, {
      ja: `予想のスコアで順位が決まります。週間は上位 20 位、月間は上位 50 位に UNIT が付きます。`,
      en: `Your score sets your rank. The top 20 weekly and top 50 monthly earn UNIT.`,
      zh: `预测分数决定排名。周榜前 20 名、月榜前 50 名可获得 UNIT。`,
      ko: `예측 점수로 순위가 정해집니다. 주간 상위 20위, 월간 상위 50위에게 UNIT이 주어집니다.`,
      es: `Tu puntuación define tu puesto. El top 20 semanal y el top 50 mensual ganan UNIT.`,
      de: `Dein Score bestimmt deinen Rang. Die Top 20 wöchentlich und Top 50 monatlich erhalten UNIT.`,
      fr: `Ton score détermine ton rang. Le top 20 hebdomadaire et le top 50 mensuel gagnent des UNIT.`,
      ar: `نقاطك تحدد ترتيبك. أفضل 20 أسبوعيًا وأفضل 50 شهريًا يحصلون على UNIT.`,
      pt: `Sua pontuação define sua posição. O top 20 semanal e o top 50 mensal ganham UNIT.`,
    }),
    firstPostCta: L(lang, {
      ja: "ランキングを見る",
      en: "See rankings",
      zh: "查看排名",
      ko: "랭킹 보기",
      es: "Ver ranking",
      de: "Rangliste ansehen",
      fr: "Voir le classement",
      ar: "عرض الترتيب",
      pt: "Ver ranking",
    }),
    firstPostClose: L(lang, {
      ja: "閉じる",
      en: "Close",
      zh: "关闭",
      ko: "닫기",
      es: "Cerrar",
      de: "Schließen",
      fr: "Fermer",
      ar: "إغلاق",
      pt: "Fechar",
    }),

    rankingsBody: L(lang, {
      ja: `予想の**スコア**で順位が並びます。\n**週間は上位 20 位、月間は上位 50 位**に UNIT が付きます（1 位は週間 ${w}・月間 ${m} UNIT）。`,
      en: `Rankings are ordered by your **prediction score**.\n**Top 20 weekly and top 50 monthly** earn UNIT (1st place: ${w} weekly, ${m} monthly UNIT).`,
      zh: `排名按你的**预测分数**排列。\n**周榜前 20 名、月榜前 50 名**可获得 UNIT（第 1 名：周榜 ${w}、月榜 ${m} UNIT）。`,
      ko: `순위는 예측 **점수**로 정해집니다.\n**주간 상위 20위, 월간 상위 50위**에게 UNIT이 주어집니다(1위: 주간 ${w}, 월간 ${m} UNIT).`,
      es: `El ranking se ordena por tu **puntuación de predicción**.\n**Top 20 semanal y top 50 mensual** ganan UNIT (1.º: ${w} semanal, ${m} mensual UNIT).`,
      de: `Die Rangliste richtet sich nach deinem **Tipp-Score**.\n**Top 20 wöchentlich und Top 50 monatlich** erhalten UNIT (Platz 1: ${w} wöchentlich, ${m} monatlich UNIT).`,
      fr: `Le classement suit ton **score de prédiction**.\n**Top 20 hebdo et top 50 mensuel** gagnent des UNIT (1re place : ${w} hebdo, ${m} mensuel UNIT).`,
      ar: `يُرتَّب الترتيب حسب **نقاط توقعك**.\n**أفضل 20 أسبوعيًا وأفضل 50 شهريًا** يحصلون على UNIT (المركز الأول: ${w} أسبوعيًا، ${m} شهريًا UNIT).`,
      pt: `O ranking segue sua **pontuação de palpite**.\n**Top 20 semanal e top 50 mensal** ganham UNIT (1º lugar: ${w} semanal, ${m} mensal UNIT).`,
    }),
  };
}
