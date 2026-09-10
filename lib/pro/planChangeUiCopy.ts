/**
 * プラン変更 / 完了画面の UI コピー（ja / en / ko / zh / es / pt / fr）。
 */
import {
  L,
  Ls,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export type PlanChangeUiLang = LocalizedLang;
export const resolvePlanChangeUiLang = resolveLocalizedLang;

export function planChangePageSubtitle(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "プランの変更手続きを行います。",
    en: "Manage your subscription plan.",
    ko: "구독 플랜을 변경합니다.",
    zh: "管理您的订阅方案。",
    es: "Administra tu plan de suscripción.",
    pt: "Gerencie seu plano de assinatura.",
    fr: "Gérez votre abonnement.",
  });
}

export function planChangeFreeGateBody(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "Pro プラン加入後に変更できます。",
    en: "Available after you join Pro.",
    ko: "Pro 가입 후 변경할 수 있습니다.",
    zh: "加入 Pro 后可更改方案。",
    es: "Disponible después de unirte a Pro.",
    pt: "Disponível após assinar o Pro.",
    fr: "Disponible après votre abonnement Pro.",
  });
}

export function planChangeUpgradeCta(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "Pro にアップグレード",
    en: "Upgrade to Pro",
    ko: "Pro 업그레이드",
    zh: "升级到 Pro",
    es: "Mejorar a Pro",
    pt: "Assinar Pro",
    fr: "Passer à Pro",
  });
}

export function planChangeScreenTitle(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "プラン変更",
    en: "Change Plan",
    ko: "플랜 변경",
    zh: "更改方案",
    es: "Cambiar plan",
    pt: "Alterar plano",
    fr: "Changer de plan",
  });
}

export function planChangeLoadingLabel(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "読み込み中",
    en: "Loading",
    ko: "불러오는 중",
    zh: "加载中",
    es: "Cargando",
    pt: "Carregando",
    fr: "Chargement",
  });
}

export function planChangeStartedLabel(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "開始日",
    en: "Started",
    ko: "시작일",
    zh: "开始日期",
    es: "Inicio",
    pt: "Início",
    fr: "Début",
  });
}

export function planChangeCurrentLabel(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "現在のプラン",
    en: "Current plan",
    ko: "현재 플랜",
    zh: "当前方案",
    es: "Plan actual",
    pt: "Plano atual",
    fr: "Plan actuel",
  });
}

export function planChangeNextLabel(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "変更後のプラン",
    en: "New plan",
    ko: "변경 후 플랜",
    zh: "新方案",
    es: "Nuevo plan",
    pt: "Novo plano",
    fr: "Nouveau plan",
  });
}

export function planChangeTaxSuffix(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "・税込み",
    en: " · tax incl.",
    ko: " · 세금 포함",
    zh: " · 含税",
    es: " · IVA incl.",
    pt: " · impostos incl.",
    fr: " · taxes incl.",
  });
}

export function planChangeConfirmHint(
  lang: PlanChangeUiLang,
  platform: "web" | "store" = "web"
): string {
  if (platform === "store") {
    return L(lang, {
      ja: "実際の変更内容・請求日はストアの管理画面で確認できます",
      en: "Confirm the exact change and billing date in your store subscription settings",
      ko: "실제 변경 내용과 청구일은 스토어 구독 설정에서 확인하세요",
      zh: "请在商店订阅设置中确认具体变更和扣款日期",
      es: "Confirma el cambio y la fecha de cobro en la configuración de suscripción de la tienda",
      pt: "Confirme a alteração e a data de cobrança nas configurações de assinatura da loja",
      fr: "Confirmez le changement et la date de facturation dans les réglages d’abonnement du store",
    });
  }
  return L(lang, {
    ja: "実際の変更内容・請求日は次の課金画面で確認できます",
    en: "Confirm the exact change and billing date on the next screen",
    ko: "실제 변경 내용과 청구일은 다음 결제 화면에서 확인하세요",
    zh: "请在下一页确认具体变更和扣款日期",
    es: "Confirma el cambio y la fecha de cobro en la siguiente pantalla",
    pt: "Confirme a alteração e a data de cobrança na próxima tela",
    fr: "Confirmez le changement et la date de facturation sur l’écran suivant",
  });
}

export function planChangeSwitchCta(
  lang: PlanChangeUiLang,
  planName: string,
  platform: "web" | "store" = "web"
): string {
  if (lang === "ja") {
    return platform === "store"
      ? `${planName} へ変更（ストア）`
      : `${planName} へ変更`;
  }
  if (lang === "ko") {
    return platform === "store"
      ? `${planName}으로 변경(스토어)`
      : `${planName}으로 변경`;
  }
  if (lang === "zh") {
    return platform === "store"
      ? `切换到 ${planName}（商店）`
      : `切换到 ${planName}`;
  }
  if (lang === "es") {
    return platform === "store"
      ? `Cambiar a ${planName} (tienda)`
      : `Cambiar a ${planName}`;
  }
  if (lang === "pt") {
    return platform === "store"
      ? `Mudar para ${planName} (loja)`
      : `Mudar para ${planName}`;
  }
  if (lang === "fr") {
    return platform === "store"
      ? `Passer à ${planName} (store)`
      : `Passer à ${planName}`;
  }
  return platform === "store"
    ? `Switch to ${planName} (Store)`
    : `Switch to ${planName}`;
}

export function planChangeOpeningLabel(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "開いています…",
    en: "Opening…",
    ko: "여는 중…",
    zh: "正在打开…",
    es: "Abriendo…",
    pt: "Abrindo…",
    fr: "Ouverture…",
  });
}

export function planChangeSeasonPassNote(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "Season Pass は買い切りのため、Weekly / Monthly への自動切替はありません。期間終了後に改めて購入してください。",
    en: "Season Pass is one-time. It does not auto-switch to Weekly / Monthly. Purchase again after it ends.",
    ko: "Season Pass는 일회성입니다. Weekly / Monthly로 자동 전환되지 않습니다. 기간 종료 후 다시 구매하세요.",
    zh: "Season Pass 为一次性购买，不会自动切换为 Weekly / Monthly。到期后请重新购买。",
    es: "Season Pass es de pago único. No cambia automáticamente a Weekly / Monthly. Vuelve a comprarlo cuando termine.",
    pt: "Season Pass é pagamento único. Não muda automaticamente para Weekly / Monthly. Compre novamente ao terminar.",
    fr: "Season Pass est un achat unique. Il ne bascule pas automatiquement vers Weekly / Monthly. Rachetez-le à la fin.",
  });
}

export function planChangeNotices(lang: PlanChangeUiLang): readonly string[] {
  return Ls(lang, [
    {
      ja: "※ Weekly / Monthly は自動更新されます。",
      en: "※ Weekly / Monthly renew automatically.",
      ko: "※ Weekly / Monthly는 자동 갱신됩니다.",
      zh: "※ Weekly / Monthly 会自动续订。",
      es: "※ Weekly / Monthly se renuevan automáticamente.",
      pt: "※ Weekly / Monthly renovam automaticamente.",
      fr: "※ Weekly / Monthly se renouvellent automatiquement.",
    },
    {
      ja: "※ ダウングレードは現在の契約期間終了後に適用されます。",
      en: "※ Downgrades apply after the current period ends.",
      ko: "※ 다운그레이드는 현재 기간 종료 후 적용됩니다.",
      zh: "※ 降级将在当前周期结束后生效。",
      es: "※ Las bajadas de plan se aplican al final del periodo actual.",
      pt: "※ Downgrades entram em vigor após o fim do período atual.",
      fr: "※ Les rétrogradations s’appliquent après la fin de la période en cours.",
    },
    {
      ja: "※ 変更までの期間は現在のプランをご利用いただけます。",
      en: "※ Keep current plan benefits until the change takes effect.",
      ko: "※ 변경 적용 전까지 현재 플랜을 이용할 수 있습니다.",
      zh: "※ 变更生效前可继续使用当前方案。",
      es: "※ Conserva tu plan actual hasta que el cambio entre en vigor.",
      pt: "※ Mantenha o plano atual até a alteração entrar em vigor.",
      fr: "※ Conservez votre plan actuel jusqu’à l’entrée en vigueur du changement.",
    },
    {
      ja: "※ ダウングレード時の返金はありません。",
      en: "※ No refunds on downgrade.",
      ko: "※ 다운그레이드 시 환불은 없습니다.",
      zh: "※ 降级不予退款。",
      es: "※ No hay reembolsos al bajar de plan.",
      pt: "※ Sem reembolso em downgrade.",
      fr: "※ Aucun remboursement en cas de rétrogradation.",
    },
  ]);
}

export function planChangePortalSignInRequired(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "ログインが必要です",
    en: "Please sign in",
    ko: "로그인이 필요합니다",
    zh: "请先登录",
    es: "Inicia sesión",
    pt: "Faça login",
    fr: "Veuillez vous connecter",
  });
}

export function planChangePortalOpenFailed(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "課金管理画面を開けませんでした。Stripe 顧客が未登録の可能性があります。",
    en: "Could not open billing. Your Stripe customer may not be registered yet.",
    ko: "결제 관리 화면을 열 수 없습니다. Stripe 고객이 등록되지 않았을 수 있습니다.",
    zh: "无法打开账单页面。Stripe 客户可能尚未注册。",
    es: "No se pudo abrir la facturación. Es posible que tu cliente de Stripe aún no esté registrado.",
    pt: "Não foi possível abrir a cobrança. Seu cliente Stripe pode ainda não estar registrado.",
    fr: "Impossible d’ouvrir la facturation. Votre client Stripe n’est peut-être pas encore enregistré.",
  });
}

export function planChangePortalNetworkError(lang: PlanChangeUiLang): string {
  return L(lang, {
    ja: "通信エラーが発生しました",
    en: "A network error occurred",
    ko: "네트워크 오류가 발생했습니다",
    zh: "发生网络错误",
    es: "Se produjo un error de red",
    pt: "Ocorreu um erro de rede",
    fr: "Une erreur réseau s’est produite",
  });
}

export function planChangeCompleteCopy(lang: PlanChangeUiLang): {
  viewProData: string;
  terms: string;
  contact: string;
  planMeta: string;
  priceMeta: string;
  untilMeta: string;
} {
  return {
    viewProData: L(lang, {
      ja: "Proデータを見る",
      en: "View Pro data",
      ko: "Pro 데이터 보기",
      zh: "查看 Pro 数据",
      es: "Ver datos Pro",
      pt: "Ver dados Pro",
      fr: "Voir les données Pro",
    }),
    terms: L(lang, {
      ja: "利用規約",
      en: "Terms of Service",
      ko: "이용약관",
      zh: "服务条款",
      es: "Términos de servicio",
      pt: "Termos de uso",
      fr: "Conditions d’utilisation",
    }),
    contact: L(lang, {
      ja: "お問い合わせ",
      en: "Contact",
      ko: "문의",
      zh: "联系我们",
      es: "Contacto",
      pt: "Contato",
      fr: "Contact",
    }),
    planMeta: L(lang, {
      ja: "プラン",
      en: "Plan",
      ko: "플랜",
      zh: "方案",
      es: "Plan",
      pt: "Plano",
      fr: "Plan",
    }),
    priceMeta: L(lang, {
      ja: "料金",
      en: "Price",
      ko: "요금",
      zh: "价格",
      es: "Precio",
      pt: "Preço",
      fr: "Prix",
    }),
    untilMeta: L(lang, {
      ja: "有効期限",
      en: "Valid until",
      ko: "유효 기간",
      zh: "有效期至",
      es: "Válido hasta",
      pt: "Válido até",
      fr: "Valable jusqu’au",
    }),
  };
}
