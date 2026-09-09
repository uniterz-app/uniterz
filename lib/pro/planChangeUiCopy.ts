/**
 * プラン変更 / 完了画面の UI コピー（ja / en）。
 */
export type PlanChangeUiLang = "ja" | "en";

export function planChangePageSubtitle(lang: PlanChangeUiLang): string {
  return lang === "en"
    ? "Manage your subscription plan."
    : "プランの変更手続きを行います。";
}

export function planChangeFreeGateBody(lang: PlanChangeUiLang): string {
  return lang === "en"
    ? "Available after you join Pro."
    : "Pro プラン加入後に変更できます。";
}

export function planChangeUpgradeCta(lang: PlanChangeUiLang): string {
  return lang === "en" ? "Upgrade to Pro" : "Pro にアップグレード";
}

export function planChangeScreenTitle(lang: PlanChangeUiLang): string {
  return lang === "en" ? "Change Plan" : "プラン変更";
}

export function planChangeStartedLabel(lang: PlanChangeUiLang): string {
  return lang === "en" ? "Started" : "開始日";
}

export function planChangeCurrentLabel(lang: PlanChangeUiLang): string {
  return lang === "en" ? "Current plan" : "現在のプラン";
}

export function planChangeNextLabel(lang: PlanChangeUiLang): string {
  return lang === "en" ? "New plan" : "変更後のプラン";
}

export function planChangeTaxSuffix(lang: PlanChangeUiLang): string {
  return lang === "en" ? " · tax incl." : "・税込み";
}

export function planChangeConfirmHint(
  lang: PlanChangeUiLang,
  platform: "web" | "store" = "web"
): string {
  if (lang === "en") {
    return platform === "store"
      ? "Confirm the exact change and billing date in your store subscription settings"
      : "Confirm the exact change and billing date on the next screen";
  }
  return platform === "store"
    ? "実際の変更内容・請求日はストアの管理画面で確認できます"
    : "実際の変更内容・請求日は次の課金画面で確認できます";
}

export function planChangeSwitchCta(
  lang: PlanChangeUiLang,
  planName: string,
  platform: "web" | "store" = "web"
): string {
  if (lang === "en") {
    return platform === "store"
      ? `Switch to ${planName} (Store)`
      : `Switch to ${planName}`;
  }
  return platform === "store"
    ? `${planName} へ変更（ストア）`
    : `${planName} へ変更`;
}

export function planChangeOpeningLabel(lang: PlanChangeUiLang): string {
  return lang === "en" ? "Opening…" : "開いています…";
}

export function planChangeSeasonPassNote(lang: PlanChangeUiLang): string {
  return lang === "en"
    ? "Season Pass is one-time. It does not auto-switch to Weekly / Monthly. Purchase again after it ends."
    : "Season Pass は買い切りのため、Weekly / Monthly への自動切替はありません。期間終了後に改めて購入してください。";
}

export function planChangeNotices(lang: PlanChangeUiLang): readonly string[] {
  if (lang === "en") {
    return [
      "※ Weekly / Monthly renew automatically.",
      "※ Downgrades apply after the current period ends.",
      "※ Keep current plan benefits until the change takes effect.",
      "※ No refunds on downgrade.",
    ];
  }
  return [
    "※ Weekly / Monthly は自動更新されます。",
    "※ ダウングレードは現在の契約期間終了後に適用されます。",
    "※ 変更までの期間は現在のプランをご利用いただけます。",
    "※ ダウングレード時の返金はありません。",
  ];
}

export function planChangePortalSignInRequired(lang: PlanChangeUiLang): string {
  return lang === "en" ? "Please sign in" : "ログインが必要です";
}

export function planChangePortalOpenFailed(lang: PlanChangeUiLang): string {
  return lang === "en"
    ? "Could not open billing. Your Stripe customer may not be registered yet."
    : "課金管理画面を開けませんでした。Stripe 顧客が未登録の可能性があります。";
}

export function planChangePortalNetworkError(lang: PlanChangeUiLang): string {
  return lang === "en" ? "A network error occurred" : "通信エラーが発生しました";
}

export function planChangeCompleteCopy(lang: PlanChangeUiLang): {
  viewProData: string;
  terms: string;
  contact: string;
  planMeta: string;
  priceMeta: string;
  untilMeta: string;
} {
  if (lang === "en") {
    return {
      viewProData: "View Pro data",
      terms: "Terms of Service",
      contact: "Contact",
      planMeta: "Plan",
      priceMeta: "Price",
      untilMeta: "Valid until",
    };
  }
  return {
    viewProData: "Proデータを見る",
    terms: "利用規約",
    contact: "お問い合わせ",
    planMeta: "プラン",
    priceMeta: "料金",
    untilMeta: "有効期限",
  };
}
