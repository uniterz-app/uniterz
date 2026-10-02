/**
 * Pro 課金プレビュー用 — プラン定義（docs/pro-billing-design.md）
 * Gap / Shadow は V1 対象外のため課金コピーから除外。
 */

import type { UiStrings } from "@/lib/i18n/ui";

export type ProSubscribePreviewPlanId = "weekly" | "monthly" | "season";

export type ProSubscribeFeatureIcon =
  | "insight"
  | "alert"
  | "rank"
  | "badge"
  | "skin"
  | "proLeague"
  | "weeklyReport"
  | "monthlyReport"
  | "season";

export type ProSubscribePreviewFeature = {
  icon: ProSubscribeFeatureIcon;
  title: UiStrings;
  detail: UiStrings;
};

export type ProSubscribePreviewPlan = {
  id: ProSubscribePreviewPlanId;
  /** ストアと揃えるプラン名（全言語共通） */
  label: string;
  /** 表示用価格（プレビュー仮・全言語共通） */
  price: string;
  period: UiStrings;
  badge?: UiStrings;
  /** バッジをアクセント色で塗る（無料トライアル訴求） */
  badgeHighlight?: boolean;
  blurb: UiStrings;
  features: readonly ProSubscribePreviewFeature[];
  /** 並び・強調 */
  recommended?: boolean;
};

/** Weekly 含む共通（Gap・Shadow なし） */
const CORE_FEATURES: readonly ProSubscribePreviewFeature[] = [
  {
    icon: "insight",
    title: {
      ja: "Pro Insight（試合前の読み）",
      en: "Pro Insight",
      ko: "Pro Insight(경기 전 분석)",
      zh: "Pro Insight（赛前解读）",
      es: "Pro Insight (lectura previa)",
      pt: "Pro Insight (leitura pré-jogo)",
      fr: "Pro Insight (lecture d’avant-match)",
    },
    detail: {
      ja: "この試合で見るべきポイントが分かる。マッチアップ・日程・状況を短く整理",
      en: "See what matters for this matchup—schedule & context, briefly.",
      ko: "이 경기에서 볼 포인트를 정리. 매치업·일정·상황을 짧게.",
      zh: "看懂这场比赛的关键。对位、赛程与情境，简要整理。",
      es: "Lo que importa de este duelo: calendario y contexto, en breve.",
      pt: "O que importa neste confronto: calendário e contexto, em resumo.",
      fr: "L’essentiel du match : calendrier et contexte, en bref.",
    },
  },
  {
    icon: "alert",
    title: {
      ja: "試合直前アラート",
      en: "Pre-tipoff alerts",
      ko: "경기 직전 알림",
      zh: "开赛前提醒",
      es: "Alertas antes del salto",
      pt: "Alertas antes da bola ao alto",
      fr: "Alertes avant l’entre-deux",
    },
    detail: {
      ja: "欠場・先発変更など、予想を見直す材料だけを通知",
      en: "Injury / lineup changes that matter—only when you should revisit.",
      ko: "결장·선발 변경 등 예측을 다시 볼 정보만 알림.",
      zh: "仅推送需要重新考虑预测的伤病与先发变动。",
      es: "Bajas y cambios de quinteto: solo cuando debas repensar tu pick.",
      pt: "Desfalques e mudanças de quinteto: só quando valer repensar.",
      fr: "Absences et changements de cinq : seulement quand ça compte.",
    },
  },
  {
    icon: "rank",
    title: {
      ja: "My Rank Pro",
      en: "My Rank Pro",
      ko: "My Rank Pro",
      zh: "My Rank Pro",
      es: "My Rank Pro",
      pt: "My Rank Pro",
      fr: "My Rank Pro",
    },
    detail: {
      ja: "TOP%、次の帯までの点数、進捗グラフが広がる",
      en: "TOP%, points to the next band, and a longer progress graph.",
      ko: "TOP%, 다음 구간까지 점수, 더 긴 진행 그래프.",
      zh: "TOP%、距离下一档的分数，以及更长的进度图。",
      es: "TOP%, puntos hasta el siguiente tramo y gráfico más largo.",
      pt: "TOP%, pontos até a próxima faixa e gráfico mais longo.",
      fr: "TOP%, points jusqu’au palier suivant et courbe plus longue.",
    },
  },
  {
    icon: "badge",
    title: {
      ja: "Pro バッジ",
      en: "Pro badge",
      ko: "Pro 배지",
      zh: "Pro 徽章",
      es: "Insignia Pro",
      pt: "Selo Pro",
      fr: "Badge Pro",
    },
    detail: {
      ja: "プロフィールやランキングに Pro バッジが表示される",
      en: "A Pro badge on your profile and rankings.",
      ko: "프로필과 랭킹에 Pro 배지가 표시됩니다.",
      zh: "在个人资料与排行榜上显示 Pro 徽章。",
      es: "Una insignia Pro en tu perfil y en los rankings.",
      pt: "Um selo Pro no seu perfil e nos rankings.",
      fr: "Un badge Pro sur votre profil et les classements.",
    },
  },
  {
    icon: "skin",
    title: {
      ja: "Pro Skin",
      en: "Pro Skin",
      ko: "Pro Skin",
      zh: "Pro Skin",
      es: "Pro Skin",
      pt: "Pro Skin",
      fr: "Pro Skin",
    },
    detail: {
      ja: "プロフィールカードの背景スキンを選べる",
      en: "Choose a background skin for your profile card.",
      ko: "프로필 카드의 배경 스킨을 고를 수 있습니다.",
      zh: "可为个人卡片选择背景皮肤。",
      es: "Elige un fondo para tu tarjeta de perfil.",
      pt: "Escolha um fundo para o seu cartão de perfil.",
      fr: "Choisissez un fond pour votre carte de profil.",
    },
  },
  {
    icon: "proLeague",
    title: {
      ja: "PRO LEAGUE（無差別級）",
      en: "PRO LEAGUE",
      ko: "PRO LEAGUE",
      zh: "PRO LEAGUE",
      es: "PRO LEAGUE",
      pt: "PRO LEAGUE",
      fr: "PRO LEAGUE",
    },
    detail: {
      ja: "全試合対象の Pro 限定ランキングに参加・閲覧できる",
      en: "Join and view the Pro-only all-games ranking board.",
      ko: "전 경기 대상 Pro 전용 랭킹에 참여·열람할 수 있습니다.",
      zh: "参与并查看涵盖全部比赛的 Pro 专属排行榜。",
      es: "Participa y consulta el ranking Pro de todos los partidos.",
      pt: "Participe e veja o ranking exclusivo Pro de todos os jogos.",
      fr: "Rejoignez et consultez le classement Pro sur tous les matchs.",
    },
  },
];

/** Monthly / Season 向け（Shadow は V1 対象外） */
const WEEKLY_REPORT: ProSubscribePreviewFeature = {
  icon: "weeklyReport",
  title: {
    ja: "週次レポート",
    en: "Weekly report",
    ko: "주간 리포트",
    zh: "周报",
    es: "Informe semanal",
    pt: "Relatório semanal",
    fr: "Rapport hebdomadaire",
  },
  detail: {
    ja: "毎週月曜に確定。順位・ライバル・次のターゲットが届く",
    en: "Finals each Monday—rank, rivals, and your next target.",
    ko: "매주 월요일 확정. 순위·라이벌·다음 목표를 전달.",
    zh: "每周一结算，送达排名、对手与下一个目标。",
    es: "Cierra cada lunes: ranking, rivales y tu próximo objetivo.",
    pt: "Fecha toda segunda: ranking, rivais e seu próximo alvo.",
    fr: "Clôturé chaque lundi : classement, rivaux et prochain objectif.",
  },
};

const MONTHLY_REPORT: ProSubscribePreviewFeature = {
  icon: "monthlyReport",
  title: {
    ja: "月次レポート",
    en: "Monthly report",
    ko: "월간 리포트",
    zh: "月报",
    es: "Informe mensual",
    pt: "Relatório mensal",
    fr: "Rapport mensuel",
  },
  detail: {
    ja: "レーダー・クセ・相性など、自分の傾向のまとめが届く",
    en: "Radar, habits, affinity—your monthly self-analysis.",
    ko: "레이더·습관·궁합 등 나의 경향을 정리해 전달.",
    zh: "雷达图、习惯、契合度——你的每月自我分析。",
    es: "Radar, hábitos y afinidad: tu autoanálisis mensual.",
    pt: "Radar, hábitos e afinidade: sua autoanálise mensal.",
    fr: "Radar, habitudes, affinités : votre bilan mensuel.",
  },
};

const SEASON_EXTRA: ProSubscribePreviewFeature = {
  icon: "season",
  title: {
    ja: "シーズン通し + 振り返り",
    en: "Full season + recap",
    ko: "시즌 전체 + 리캡",
    zh: "整个赛季 + 回顾",
    es: "Temporada completa + resumen",
    pt: "Temporada inteira + retrospectiva",
    fr: "Saison complète + rétrospective",
  },
  detail: {
    ja: "対象 NBA シーズンは原則 7/31 まで Pro。シーズン振り返り（予定）",
    en: "Pro through the NBA season (through July 31). Season recap (planned).",
    ko: "해당 NBA 시즌은 원칙적으로 7/31까지 Pro. 시즌 리캡(예정).",
    zh: "该 NBA 赛季原则上 Pro 至 7/31。赛季回顾（计划中）。",
    es: "Pro durante la temporada NBA (hasta el 31/7). Resumen de temporada (previsto).",
    pt: "Pro durante a temporada da NBA (até 31/7). Retrospectiva (planejada).",
    fr: "Pro pendant la saison NBA (jusqu’au 31/7). Rétrospective (prévue).",
  },
};

const TRIAL_BADGE: UiStrings = {
  ja: "7日無料",
  en: "7-day free",
  ko: "7일 무료",
  zh: "7 天免费",
  es: "7 días gratis",
  pt: "7 dias grátis",
  fr: "7 jours offerts",
};

export const PRO_SUBSCRIBE_PREVIEW_PLANS: readonly ProSubscribePreviewPlan[] = [
  {
    id: "weekly",
    label: "Weekly",
    price: "¥280",
    period: {
      ja: "/ 週",
      en: "/ week",
      ko: "/ 주",
      zh: "/ 周",
      es: "/ semana",
      pt: "/ semana",
      fr: "/ semaine",
    },
    badge: TRIAL_BADGE,
    badgeHighlight: true,
    blurb: {
      ja: "まずは1週間。気軽に Pro を体験 · 初回7日無料",
      en: "Start with one week. Try Pro lightly · 7-day trial first",
      ko: "우선 1주일. 부담 없이 Pro 체험 · 첫 7일 무료",
      zh: "先试一周，轻松体验 Pro · 首次 7 天免费",
      es: "Empieza con una semana. Prueba Pro sin más · 7 días gratis",
      pt: "Comece com uma semana. Experimente o Pro · 7 dias grátis",
      fr: "Commencez par une semaine. Essayez Pro · 7 jours offerts",
    },
    features: [...CORE_FEATURES, WEEKLY_REPORT],
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "¥780",
    period: {
      ja: "/ 月",
      en: "/ month",
      ko: "/ 월",
      zh: "/ 月",
      es: "/ mes",
      pt: "/ mês",
      fr: "/ mois",
    },
    badge: TRIAL_BADGE,
    badgeHighlight: true,
    recommended: true,
    blurb: {
      ja: "毎週ランキングを追う人の定番 · 初回7日無料",
      en: "Standard for ranking chasers · 7-day trial first",
      ko: "매주 랭킹을 쫓는 사람의 기본 · 첫 7일 무료",
      zh: "每周追排行榜的人的标配 · 首次 7 天免费",
      es: "El estándar para quien persigue el ranking · 7 días gratis",
      pt: "O padrão de quem persegue o ranking · 7 dias grátis",
      fr: "La référence pour suivre le classement · 7 jours offerts",
    },
    features: [...CORE_FEATURES, WEEKLY_REPORT, MONTHLY_REPORT],
  },
  {
    id: "season",
    label: "Season Pass",
    price: "¥5,000",
    period: {
      ja: "〜7/31",
      en: "until Jul 31",
      ko: "7/31까지",
      zh: "至 7/31",
      es: "hasta 31/7",
      pt: "até 31/7",
      fr: "jusqu’au 31/7",
    },
    badge: {
      ja: "〜7月末",
      en: "Until July",
      ko: "7월 말까지",
      zh: "至 7 月底",
      es: "Hasta julio",
      pt: "Até julho",
      fr: "Jusqu’en juillet",
    },
    blurb: {
      ja: "対象 NBA シーズン終了まで Pro。自動更新なし。途中解約の返金なし。次シーズンは再購入。",
      en: "Pro through the NBA season. No auto-renew. No mid-season refund. Buy again next season.",
      ko: "해당 NBA 시즌 종료까지 Pro. 자동 갱신 없음. 중도 환불 없음. 다음 시즌은 재구매.",
      zh: "Pro 覆盖至该 NBA 赛季结束。无自动续订，中途不退款。下赛季需再购。",
      es: "Pro hasta el fin de la temporada NBA. Sin renovación automática ni reembolso. Recompra la próxima.",
      pt: "Pro até o fim da temporada da NBA. Sem renovação automática nem reembolso. Compre de novo na próxima.",
      fr: "Pro jusqu’à la fin de la saison NBA. Pas de renouvellement auto ni de remboursement. Racheter la saison suivante.",
    },
    features: [...CORE_FEATURES, WEEKLY_REPORT, MONTHLY_REPORT, SEASON_EXTRA],
  },
];

export function proSubscribePreviewPlanById(
  id: ProSubscribePreviewPlanId
): ProSubscribePreviewPlan {
  return (
    PRO_SUBSCRIBE_PREVIEW_PLANS.find((p) => p.id === id) ??
    PRO_SUBSCRIBE_PREVIEW_PLANS[1]!
  );
}
