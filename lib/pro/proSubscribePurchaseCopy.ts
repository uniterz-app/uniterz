/**
 * Get Pro 購入ページ用コピー（Web / Native 共通・7言語）。
 * 終了日の正: lib/legal/companyInfo.ts `SEASON_PASS_END_MONTH_DAY`
 */

import { SEASON_PASS_END_MONTH_DAY } from "@/lib/legal/companyInfo";
import {
  L,
  Ls,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { CURRENT_NBA_SEASON_KEY, nbaSeasonKeyFromDateJST } from "@/lib/rankings/nbaSeason";

export type ProSubscribeLang = LocalizedLang;

function asLang(lang: LocalizedLang | string): LocalizedLang {
  return resolveLocalizedLang(lang);
}

/** `"2026-27"` → 終了年 2027（原則 7/31） */
export function seasonPassEndYear(seasonKey: string): number {
  const start = Number.parseInt(seasonKey.slice(0, 4), 10);
  return Number.isFinite(start) ? start + 1 : new Date().getFullYear() + 1;
}

export function seasonPassTargetLabel(
  lang: LocalizedLang | string,
  now = new Date()
): string {
  const key = nbaSeasonKeyFromDateJST(now);
  const endY = seasonPassEndYear(key);
  return L(asLang(lang), {
    ja: `${key} · 〜${endY}/7/31`,
    en: `${key} · until ${endY}/7/31`,
    ko: `${key} · ~${endY}/7/31`,
    zh: `${key} · 至 ${endY}/7/31`,
    es: `${key} · hasta ${endY}/7/31`,
    pt: `${key} · até ${endY}/7/31`,
    fr: `${key} · jusqu’au ${endY}/7/31`,
  });
}

export function seasonPassPeriodShort(
  lang: LocalizedLang | string,
  now = new Date()
): string {
  const key = nbaSeasonKeyFromDateJST(now);
  const endY = seasonPassEndYear(key);
  void key;
  return L(asLang(lang), {
    ja: `〜${endY}/7/31`,
    en: `until ${endY}/7/31`,
    ko: `~${endY}/7/31`,
    zh: `至 ${endY}/7/31`,
    es: `hasta ${endY}/7/31`,
    pt: `até ${endY}/7/31`,
    fr: `jusqu’au ${endY}/7/31`,
  });
}

export function seasonPassBlurb(
  lang: LocalizedLang | string,
  now = new Date()
): string {
  const key = nbaSeasonKeyFromDateJST(now);
  const endY = seasonPassEndYear(key);
  return L(asLang(lang), {
    ja: `${key} シーズン終了（原則 ${endY}/7/31・${SEASON_PASS_END_MONTH_DAY}）まで Pro。自動更新なし。途中解約の返金なし。次シーズンは再購入。`,
    en: `Pro through ${key} (through ${endY}/7/31). No auto-renew. No mid-season refund. Buy again next season.`,
    ko: `${key} 시즌 종료(원칙 ${endY}/7/31·${SEASON_PASS_END_MONTH_DAY})까지 Pro. 자동 갱신 없음. 중도 환불 없음. 다음 시즌은 재구매.`,
    zh: `Pro 覆盖至 ${key} 赛季结束（原则上 ${endY}/7/31·${SEASON_PASS_END_MONTH_DAY}）。无自动续订，中途不退款。下赛季需再购。`,
    es: `Pro hasta el fin de ${key} (hasta ${endY}/7/31). Sin renovación automática ni reembolso a mitad de temporada. Recompra la próxima.`,
    pt: `Pro até o fim de ${key} (até ${endY}/7/31). Sem renovação automática nem reembolso no meio. Compre de novo na próxima.`,
    fr: `Pro jusqu’à la fin de ${key} (jusqu’au ${endY}/7/31). Pas de renouvellement auto ni de remboursement en cours. Racheter la saison suivante.`,
  });
}

export type PlanDiffCell = "yes" | "no";

export type PlanDiffRow = {
  id: string;
  label: UiStrings;
  weekly: PlanDiffCell;
  monthly: PlanDiffCell;
  season: PlanDiffCell;
};

/** スクロールなしで見せるプラン差（購入ページ上部） */
export const PRO_SUBSCRIBE_PLAN_DIFF_ROWS: readonly PlanDiffRow[] = [
  {
    id: "monthlyReport",
    label: {
      ja: "月次レポート",
      en: "Monthly report",
      ko: "월간 리포트",
      zh: "月度报告",
      es: "Informe mensual",
      pt: "Relatório mensal",
      fr: "Rapport mensuel",
    },
    weekly: "no",
    monthly: "yes",
    season: "yes",
  },
  {
    id: "trial",
    label: {
      ja: "7日無料",
      en: "7-day trial",
      ko: "7일 무료",
      zh: "7 天免费",
      es: "Prueba 7 días",
      pt: "7 dias grátis",
      fr: "Essai 7 jours",
    },
    weekly: "yes",
    monthly: "yes",
    season: "no",
  },
];

export function planDiffRowLabel(
  row: PlanDiffRow,
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), row.label);
}

export function planDiffTitle(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "プランのちがい",
    en: "Plan differences",
    ko: "플랜 차이",
    zh: "方案差异",
    es: "Diferencias de plan",
    pt: "Diferenças do plano",
    fr: "Différences de plan",
  });
}

export function planDiffColLabel(
  col: "weekly" | "monthly" | "season",
  _lang: LocalizedLang | string
): string {
  if (col === "weekly") return "Weekly";
  if (col === "monthly") return "Monthly";
  return "Season";
}

export function planDiffCellLabel(
  cell: PlanDiffCell,
  lang: LocalizedLang | string
): string {
  if (cell === "yes") {
    return L(asLang(lang), {
      ja: "あり",
      en: "Yes",
      ko: "있음",
      zh: "有",
      es: "Sí",
      pt: "Sim",
      fr: "Oui",
    });
  }
  return L(asLang(lang), {
    ja: "なし",
    en: "No",
    ko: "없음",
    zh: "无",
    es: "No",
    pt: "Não",
    fr: "Non",
  });
}

export function trialConditionsTitle(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "無料トライアル",
    en: "Free trial",
    ko: "무료 체험",
    zh: "免费试用",
    es: "Prueba gratis",
    pt: "Teste grátis",
    fr: "Essai gratuit",
  });
}

/** トライアル条件（購入ページ常時表示） */
export function trialConditionLines(
  lang: LocalizedLang | string
): readonly string[] {
  return Ls(asLang(lang), [
    {
      ja: "Weekly / Monthly の初回のみ（アカウントあたり原則1回）。Season Pass は対象外。",
      en: "First time only on Weekly / Monthly (generally once per account). Season Pass has no trial.",
      ko: "Weekly / Monthly 첫 회만(계정당 원칙 1회). Season Pass는 제외.",
      zh: "仅限 Weekly / Monthly 首次（每个账号原则上一次）。Season Pass 无试用。",
      es: "Solo la primera vez en Weekly / Monthly (en general 1 por cuenta). Season Pass sin prueba.",
      pt: "Só na 1ª vez em Weekly / Monthly (em geral 1 por conta). Season Pass sem teste.",
      fr: "Uniquement la 1re fois Weekly / Monthly (en principe 1 par compte). Pas d’essai Season Pass.",
    },
    {
      ja: "お試し開始から7日後に初回請求（Weekly ¥280 / 週、Monthly ¥780 / 月。ストア表示を優先）。",
      en: "First charge 7 days after trial starts (Weekly ¥280/week, Monthly ¥780/month; store price wins).",
      ko: "체험 시작 7일 후 첫 청구(Weekly ¥280/주, Monthly ¥780/월. 스토어 표시 우선).",
      zh: "试用开始 7 天后首次扣款（Weekly ¥280/周、Monthly ¥780/月；以商店显示为准）。",
      es: "Primer cobro a los 7 días (Weekly ¥280/sem, Monthly ¥780/mes; gana el precio de la tienda).",
      pt: "1ª cobrança 7 dias após o início (Weekly ¥280/sem, Monthly ¥780/mês; preço da loja vence).",
      fr: "1er débit 7 jours après le début (Weekly ¥280/sem, Monthly ¥780/mois ; prix store prioritaire).",
    },
    {
      ja: "無料期間中に解約すれば課金されません。解約しなければ自動で有料に切り替わります。",
      en: "Cancel during the free period and you won’t be charged. Otherwise it auto-renews to paid.",
      ko: "무료 기간에 해지하면 과금되지 않습니다. 해지하지 않으면 자동으로 유료 전환됩니다.",
      zh: "免费期内取消则不会扣费；不取消将自动转为付费。",
      es: "Si cancelas en el periodo gratis, no se cobra. Si no, pasa a pago automáticamente.",
      pt: "Cancele no período grátis e não será cobrado. Senão, renova para pago automaticamente.",
      fr: "Annulez pendant l’essai et vous ne serez pas facturé. Sinon, passage auto en payant.",
    },
  ]);
}

export function purchaseDisclaimer(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "他人の予想は見せません。勝者は断言しません。",
    en: "We never show others’ picks or declare winners.",
    ko: "타인의 예측은 보여주지 않습니다. 승자를 단정하지 않습니다.",
    zh: "不会展示他人预测，也不会断言胜者。",
    es: "Nunca mostramos picks ajenos ni declaramos ganadores.",
    pt: "Nunca mostramos palpites de outros nem declaramos vencedores.",
    fr: "Nous ne montrons jamais les picks des autres ni ne déclarons de gagnants.",
  });
}

export type ProLegalLinkKind = "terms" | "privacy" | "tokushoho";

export function proLegalLinkLabel(
  kind: ProLegalLinkKind,
  lang: LocalizedLang | string
): string {
  const resolved = asLang(lang);
  if (kind === "terms") {
    return L(resolved, {
      ja: "利用規約",
      en: "Terms",
      ko: "이용약관",
      zh: "使用条款",
      es: "Términos",
      pt: "Termos",
      fr: "Conditions",
    });
  }
  if (kind === "privacy") {
    return L(resolved, {
      ja: "プライバシー",
      en: "Privacy",
      ko: "개인정보",
      zh: "隐私",
      es: "Privacidad",
      pt: "Privacidade",
      fr: "Confidentialité",
    });
  }
  return L(resolved, {
    ja: "特定商取引法",
    en: "Legal notice",
    ko: "특정상거래법",
    zh: "特定商业交易法",
    es: "Aviso legal",
    pt: "Aviso legal",
    fr: "Mentions légales",
  });
}

/** モバイル Web パス（デスクトップは /web/* に差し替え） */
export const PRO_LEGAL_PATHS_MOBILE = {
  terms: "/mobile/terms",
  privacy: "/mobile/privacy",
  tokushoho: "/mobile/law",
} as const;

export const PRO_LEGAL_PATHS_WEB = {
  terms: "/web/terms",
  privacy: "/web/privacy",
  tokushoho: "/web/law",
} as const;

export function restorePurchasesLabel(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "購入を復元",
    en: "Restore Purchases",
    ko: "구매 복원",
    zh: "恢复购买",
    es: "Restaurar compras",
    pt: "Restaurar compras",
    fr: "Restaurer les achats",
  });
}

export function taxInclLabel(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "税込み",
    en: "tax incl.",
    ko: "세금 포함",
    zh: "含税",
    es: "IVA incl.",
    pt: "impostos incl.",
    fr: "taxes incl.",
  });
}

export function currentSeasonPassKey(): string {
  return CURRENT_NBA_SEASON_KEY;
}

/** 購入ページ本体のコピー（Web `ProSubscribePreview` / Native 共通） */

export function proSubscribeLead(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "プランをタップして、できることを確認。もう一度タップで閉じます。",
    en: "Tap a plan to see what’s included. Tap again to close.",
    ko: "플랜을 탭해 포함 내용을 확인하세요. 다시 탭하면 닫힙니다.",
    zh: "点击方案查看包含内容，再次点击可收起。",
    es: "Toca un plan para ver qué incluye. Toca otra vez para cerrar.",
    pt: "Toque num plano para ver o que inclui. Toque de novo para fechar.",
    fr: "Touchez un plan pour voir son contenu. Touchez à nouveau pour fermer.",
  });
}

export function proSubscribeIncludedTitle(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "このプランでできること",
    en: "Included",
    ko: "이 플랜에 포함",
    zh: "该方案包含",
    es: "Incluye",
    pt: "Inclui",
    fr: "Inclus",
  });
}

export function proSubscribeProcessingLabel(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "処理中…",
    en: "Processing…",
    ko: "처리 중…",
    zh: "处理中…",
    es: "Procesando…",
    pt: "Processando…",
    fr: "Traitement…",
  });
}

export function proSubscribeStartTrialLabel(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "7日間無料で試す",
    en: "Start 7-day free trial",
    ko: "7일 무료로 시작",
    zh: "开始 7 天免费试用",
    es: "Empezar prueba de 7 días",
    pt: "Iniciar teste de 7 dias",
    fr: "Démarrer l’essai de 7 jours",
  });
}

/** 「お試し後は週額 ¥280。期間中の解約で課金なし。」 */
export function proSubscribeAfterTrialNote(
  lang: LocalizedLang | string,
  plan: "weekly" | "monthly"
): string {
  const weekly = plan === "weekly";
  return L(asLang(lang), {
    ja: weekly
      ? "お試し後は週額 ¥280。期間中の解約で課金なし。"
      : "お試し後は月額 ¥780。期間中の解約で課金なし。",
    en: weekly
      ? "Then ¥280/week. Cancel during trial — no charge."
      : "Then ¥780/month. Cancel during trial — no charge.",
    ko: weekly
      ? "체험 후 주 ¥280. 기간 중 해지하면 과금 없음."
      : "체험 후 월 ¥780. 기간 중 해지하면 과금 없음.",
    zh: weekly
      ? "试用后 ¥280/周。期间取消不扣费。"
      : "试用后 ¥780/月。期间取消不扣费。",
    es: weekly
      ? "Después ¥280/semana. Cancela en la prueba: sin cargo."
      : "Después ¥780/mes. Cancela en la prueba: sin cargo.",
    pt: weekly
      ? "Depois ¥280/semana. Cancele no teste: sem cobrança."
      : "Depois ¥780/mês. Cancele no teste: sem cobrança.",
    fr: weekly
      ? "Ensuite ¥280/semaine. Annulez pendant l’essai : aucun débit."
      : "Ensuite ¥780/mois. Annulez pendant l’essai : aucun débit.",
  });
}

export function proSubscribeBuyWithoutTrialLabel(
  lang: LocalizedLang | string,
  planLabel: string
): string {
  return L(asLang(lang), {
    ja: `お試しなしで${planLabel}を購入`,
    en: `Buy ${planLabel} (no trial)`,
    ko: `체험 없이 ${planLabel} 구매`,
    zh: `不试用，直接购买 ${planLabel}`,
    es: `Comprar ${planLabel} (sin prueba)`,
    pt: `Comprar ${planLabel} (sem teste)`,
    fr: `Acheter ${planLabel} (sans essai)`,
  });
}

export function proSubscribeBuyPreviewLabel(
  lang: LocalizedLang | string,
  planLabel: string
): string {
  return L(asLang(lang), {
    ja: `${planLabel} を購入（プレビュー）`,
    en: `Buy ${planLabel} (preview)`,
    ko: `${planLabel} 구매(프리뷰)`,
    zh: `购买 ${planLabel}（预览）`,
    es: `Comprar ${planLabel} (vista previa)`,
    pt: `Comprar ${planLabel} (prévia)`,
    fr: `Acheter ${planLabel} (aperçu)`,
  });
}

export function proSubscribeTrialMicroNote(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "※ 初回のみ。iOS は App Store のサブスク管理から解約できます。プレビューでは決済しません。",
    en: "※ First time only. On iOS, cancel in App Store subscriptions. Preview does not charge.",
    ko: "※ 최초 1회만. iOS는 App Store 구독 관리에서 해지할 수 있습니다. 프리뷰에서는 결제되지 않습니다.",
    zh: "※ 仅限首次。iOS 可在 App Store 订阅管理中取消。预览不会实际扣款。",
    es: "※ Solo la primera vez. En iOS, cancela en suscripciones de App Store. La vista previa no cobra.",
    pt: "※ Só na 1ª vez. No iOS, cancele nas assinaturas da App Store. A prévia não cobra.",
    fr: "※ 1re fois seulement. Sur iOS, annulez dans les abonnements App Store. L’aperçu ne débite pas.",
  });
}

export function proSubscribeNoTrialMicroNote(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "※ 7日無料は Weekly / Monthly のみ。価格・特典は仮。決済は走りません。",
    en: "※ 7-day trial is Weekly / Monthly only. Prices are draft. No real charge.",
    ko: "※ 7일 무료는 Weekly / Monthly 전용. 가격·혜택은 임시. 실제 결제는 없습니다.",
    zh: "※ 7 天免费仅限 Weekly / Monthly。价格与权益为暂定，不会实际扣款。",
    es: "※ La prueba de 7 días es solo Weekly / Monthly. Precios provisionales. Sin cobro real.",
    pt: "※ O teste de 7 dias é só Weekly / Monthly. Preços provisórios. Sem cobrança real.",
    fr: "※ L’essai de 7 jours ne concerne que Weekly / Monthly. Prix provisoires. Aucun débit réel.",
  });
}

export function proSubscribeTrialModalTitle(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "お試しの前に",
    en: "Before you start",
    ko: "체험 전에",
    zh: "试用前请确认",
    es: "Antes de empezar",
    pt: "Antes de começar",
    fr: "Avant de commencer",
  });
}

export function proSubscribeTrialModalSelected(
  lang: LocalizedLang | string,
  planLabel: string
): string {
  return L(asLang(lang), {
    ja: `選択中: ${planLabel} · 7日間無料`,
    en: `Selected: ${planLabel} · 7-day free`,
    ko: `선택: ${planLabel} · 7일 무료`,
    zh: `已选择: ${planLabel} · 7 天免费`,
    es: `Seleccionado: ${planLabel} · 7 días gratis`,
    pt: `Selecionado: ${planLabel} · 7 dias grátis`,
    fr: `Sélection : ${planLabel} · 7 jours offerts`,
  });
}

/** お試し確認モーダルの箇条書き */
export function proSubscribeTrialModalPoints(
  lang: LocalizedLang | string,
  planLabel: string,
  afterPrice: string
): readonly string[] {
  const resolved = asLang(lang);
  return Ls(resolved, [
    {
      ja: "7日間無料で Pro を試せます（アカウントあたり初回のみ）。",
      en: "Try Pro free for 7 days (first time only per account).",
      ko: "7일간 무료로 Pro를 사용할 수 있습니다(계정당 최초 1회).",
      zh: "可免费试用 Pro 7 天（每个账号仅限首次）。",
      es: "Prueba Pro gratis 7 días (solo la primera vez por cuenta).",
      pt: "Teste o Pro grátis por 7 dias (só na 1ª vez por conta).",
      fr: "Essayez Pro gratuitement 7 jours (1re fois par compte).",
    },
    {
      ja: "期間中に解約すれば、お金はかかりません。",
      en: "Cancel during the trial and you won’t be charged.",
      ko: "기간 중에 해지하면 요금이 청구되지 않습니다.",
      zh: "在试用期内取消则不会产生费用。",
      es: "Si cancelas durante la prueba, no se te cobrará.",
      pt: "Se cancelar durante o teste, não haverá cobrança.",
      fr: "Annulez pendant l’essai et vous ne serez pas facturé.",
    },
    {
      ja: `解約しなければ、お試し開始から7日後に初回請求され、自動で有料の ${planLabel}（${afterPrice}）に切り替わります。`,
      en: `Unless you cancel, the first charge is 7 days after start, then paid ${planLabel} (${afterPrice}).`,
      ko: `해지하지 않으면 체험 시작 7일 후 첫 청구가 되고, 유료 ${planLabel}(${afterPrice})로 자동 전환됩니다.`,
      zh: `若不取消，将在试用开始 7 天后首次扣款，并自动转为付费的 ${planLabel}（${afterPrice}）。`,
      es: `Si no cancelas, el primer cobro es 7 días después del inicio y pasa al plan de pago ${planLabel} (${afterPrice}).`,
      pt: `Se não cancelar, a 1ª cobrança ocorre 7 dias após o início e passa para o pago ${planLabel} (${afterPrice}).`,
      fr: `Sans annulation, le 1er débit a lieu 7 jours après le début, puis passage au ${planLabel} payant (${afterPrice}).`,
    },
    {
      ja: "Weekly と Monthly の変更は、いつでもできます。",
      en: "You can switch Weekly ⇔ Monthly anytime.",
      ko: "Weekly ⇔ Monthly 변경은 언제든 가능합니다.",
      zh: "Weekly ⇔ Monthly 可随时切换。",
      es: "Puedes cambiar entre Weekly y Monthly cuando quieras.",
      pt: "Você pode alternar entre Weekly e Monthly quando quiser.",
      fr: "Vous pouvez passer de Weekly à Monthly à tout moment.",
    },
  ]);
}

export function proSubscribeSuccessTitle(
  lang: LocalizedLang | string,
  trial: boolean
): string {
  if (!trial) return "Upgrade to Pro";
  return L(asLang(lang), {
    ja: "Pro お試し開始",
    en: "Pro trial started",
    ko: "Pro 체험 시작",
    zh: "Pro 试用已开始",
    es: "Prueba Pro iniciada",
    pt: "Teste Pro iniciado",
    fr: "Essai Pro démarré",
  });
}

/** 成功画面の価格行プレフィックス（お試し時のみ） */
export function proSubscribeFreeThenPrefix(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "無料 → その後 ",
    en: "FREE → THEN ",
    ko: "무료 → 이후 ",
    zh: "免费 → 之后 ",
    es: "GRATIS → LUEGO ",
    pt: "GRÁTIS → DEPOIS ",
    fr: "GRATUIT → PUIS ",
  });
}

export function proSubscribeCancelInTrialValue(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "期間中解約で課金なし",
    en: "Cancel in trial = ¥0",
    ko: "기간 중 해지 시 ¥0",
    zh: "期内取消 = ¥0",
    es: "Cancelar en prueba = ¥0",
    pt: "Cancelar no teste = ¥0",
    fr: "Annuler pendant l’essai = ¥0",
  });
}

export function proSubscribeChooseSkinLabel(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "Pro Skin を選ぶ",
    en: "Choose Pro Skin",
    ko: "Pro Skin 선택",
    zh: "选择 Pro Skin",
    es: "Elegir Pro Skin",
    pt: "Escolher Pro Skin",
    fr: "Choisir un Pro Skin",
  });
}

export function proSubscribeTryProSkinLabel(
  lang: LocalizedLang | string
): string {
  return L(asLang(lang), {
    ja: "Pro Skinを試す",
    en: "Try Pro Skin",
    ko: "Pro Skin 사용해보기",
    zh: "试试 Pro Skin",
    es: "Probar Pro Skin",
    pt: "Experimentar Pro Skin",
    fr: "Essayer un Pro Skin",
  });
}

export function proSubscribeBackLabel(lang: LocalizedLang | string): string {
  return L(asLang(lang), {
    ja: "戻る",
    en: "Back",
    ko: "뒤로",
    zh: "返回",
    es: "Atrás",
    pt: "Voltar",
    fr: "Retour",
  });
}
