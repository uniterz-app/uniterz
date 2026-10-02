/**
 * 通知設定で Free が Pro 行を触ったときのゲート文面（7言語）
 */
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export type NotificationProGateBullet = {
  title: string;
  detail: string;
};

export type NotificationProGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  priceLabel: string;
  price: string;
  period: string;
  trial: string;
  bullets: readonly NotificationProGateBullet[];
  cta: string;
  dismiss: string;
};

export function notificationProGateCopy(
  language: LocalizedLang | string
): NotificationProGateCopy {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "PRO ONLY",
    title: L(lang, {
      ja: "この通知は Pro 限定です",
      en: "This alert is Pro-only",
      ko: "이 알림은 Pro 전용입니다",
      zh: "此通知仅限 Pro",
      es: "Esta alerta es solo Pro",
      pt: "Este alerta é só Pro",
      fr: "Cette alerte est réservée Pro",
    }),
    body: L(lang, {
      ja: "欠場・Insight — 予想を見直すべきときだけ。",
      en: "Injury and Insight — only when you should recheck a pick.",
      ko: "결장·Insight — 예측을 다시 볼 때만.",
      zh: "伤停与 Insight — 仅在需要重看预测时。",
      es: "Lesión e Insight: solo cuando debas revisar tu pick.",
      pt: "Lesão e Insight — só quando vale rever o palpite.",
      fr: "Blessure et Insight — seulement pour revoir un pick.",
    }),
    priceLabel: "Monthly",
    price: "¥780",
    period: L(lang, {
      ja: "/ 月",
      en: "/ month",
      ko: "/ 월",
      zh: "/ 月",
      es: "/ mes",
      pt: "/ mês",
      fr: "/ mois",
    }),
    trial: L(lang, {
      ja: "初回 7 日無料",
      en: "7-day free trial",
      ko: "첫 7일 무료",
      zh: "首次 7 天免费",
      es: "7 días de prueba gratis",
      pt: "7 dias grátis",
      fr: "7 jours d’essai gratuits",
    }),
    bullets: [
      {
        title: L(lang, {
          ja: "試合直前アラート",
          en: "Pre-tipoff alerts",
          ko: "경기 직전 알림",
          zh: "赛前即时提醒",
          es: "Alertas pre-partido",
          pt: "Alertas pré-jogo",
          fr: "Alertes pré-match",
        }),
        detail: L(lang, {
          ja: "欠場アラート。締切は 60 / 10 分前も選べる",
          en: "Injury alerts. Deadline also unlocks 60 / 10 min",
          ko: "결장 알림. 마감 60/10분 전도 선택 가능",
          zh: "伤停提醒。截止也可选赛前 60/10 分钟",
          es: "Alertas de lesión. Cierre también a 60 / 10 min",
          pt: "Alertas de lesão. Prazo também 60 / 10 min",
          fr: "Alertes blessure. Deadline aussi 60 / 10 min",
        }),
      },
      {
        title: "Pro Insight",
        detail: L(lang, {
          ja: "試合前の読み。結論が変わったときだけ通知",
          en: "Match reads. Notify only when the conclusion changes",
          ko: "경기 전 리딩. 결론이 바뀔 때만 알림",
          zh: "赛前解读。仅在结论变化时通知",
          es: "Lecturas del partido. Solo si cambia la conclusión",
          pt: "Leituras da partida. Só se a conclusão mudar",
          fr: "Lectures match. Seulement si la conclusion change",
        }),
      },
      {
        title: "PRO LEAGUE",
        detail: L(lang, {
          ja: "全試合対象の Pro 限定ランキング",
          en: "Pro-only rankings across every game",
          ko: "전 경기 Pro 전용 랭킹",
          zh: "覆盖全部比赛的 Pro 专属排名",
          es: "Ranking solo Pro en todos los partidos",
          pt: "Ranking só Pro em todos os jogos",
          fr: "Classement Pro uniquement sur tous les matchs",
        }),
      },
      {
        title: "My Rank Pro",
        detail: L(lang, {
          ja: "TOP%、次の帯までの点数、進捗グラフ",
          en: "TOP%, points to the next band, longer graph",
          ko: "TOP%, 다음 구간까지 점수, 진행 그래프",
          zh: "TOP%、到下一档的分数、进度图",
          es: "TOP%, puntos al siguiente tramo, gráfico largo",
          pt: "TOP%, pontos até a próxima faixa, gráfico longo",
          fr: "TOP%, points jusqu’à la prochaine bande, graphe long",
        }),
      },
      {
        title: L(lang, {
          ja: "月次レポート",
          en: "Monthly report",
          ko: "월간 리포트",
          zh: "月度报告",
          es: "Informe mensual",
          pt: "Relatório mensal",
          fr: "Rapport mensuel",
        }),
        detail: L(lang, {
          ja: "レーダー・クセ・相性のまとめが届く",
          en: "Radar, habits, affinity — your monthly recap",
          ko: "레이더·습관·상성 요약이 도착",
          zh: "雷达、习惯、相性 — 月度汇总",
          es: "Radar, hábitos y afinidad — resumen mensual",
          pt: "Radar, hábitos e afinidade — resumo mensal",
          fr: "Radar, habitudes, affinité — bilan mensuel",
        }),
      },
    ],
    cta: "Explore Pro",
    dismiss: L(lang, {
      ja: "とじる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
  };
}
