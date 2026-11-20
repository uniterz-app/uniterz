import { useCallback, useEffect, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  PurchaseStateAndroid,
  type Product,
  type ProductPurchase,
  type Subscription,
  type SubscriptionAndroid,
  type PurchaseError,
} from "react-native-iap";
import {
  IAP_ALL_SKUS,
  IAP_ONE_TIME_SKUS,
  IAP_SUBSCRIPTION_SKUS,
  isSubscriptionPlan,
  productIdForPlan,
  type ProIapPlan,
} from "./iapProductIds";
import { auth } from "../../lib/firebase";
import { invalidateProfileUserDocNative } from "../profile/profileUserDocCacheNative";
import { trackProPurchaseNative } from "./proFunnelNative";
import { L, resolveLocalizedLang, type LocalizedLang } from "../../../../../lib/i18n/localize";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type CatalogItem = Subscription | Product;

function iapCopy(lang: LocalizedLang) {
  return {
    errorTitle: L(lang, {
      ja: "購入エラー",
      en: "Purchase error",
      ko: "구매 오류",
      zh: "购买错误",
      es: "Error de compra",
      pt: "Erro na compra",
      fr: "Erreur d'achat",
    }),
    verifyFailed: L(lang, {
      ja: "購入の検証に失敗しました。アプリを開き直すと自動で再確認します。",
      en: "We couldn't verify the purchase. It will be checked again when you reopen the app.",
      ko: "구매를 확인하지 못했습니다. 앱을 다시 열면 자동으로 다시 확인합니다.",
      zh: "无法验证此次购买。重新打开应用时会自动再次确认。",
      es: "No pudimos verificar la compra. Se volverá a comprobar al reabrir la app.",
      pt: "Não foi possível verificar a compra. Ela será verificada novamente ao reabrir o app.",
      fr: "Impossible de vérifier l'achat. Il sera revérifié à la réouverture de l'application.",
    }),
    purchaseFailed: L(lang, {
      ja: "購入処理に失敗しました。",
      en: "The purchase failed.",
      ko: "구매 처리에 실패했습니다.",
      zh: "购买处理失败。",
      es: "La compra no se pudo completar.",
      pt: "A compra falhou.",
      fr: "L'achat a échoué.",
    }),
    storeUnavailable: L(lang, {
      ja: "ストアに接続できませんでした。時間をおいて再度お試しください。",
      en: "Couldn't connect to the store. Please try again later.",
      ko: "스토어에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      zh: "无法连接应用商店。请稍后再试。",
      es: "No se pudo conectar con la tienda. Inténtalo de nuevo más tarde.",
      pt: "Não foi possível conectar à loja. Tente novamente mais tarde.",
      fr: "Impossible de se connecter à la boutique. Réessayez plus tard.",
    }),
    trialUnavailable: L(lang, {
      ja: "このアカウントでは無料お試しを利用できません。お試しなしで購入してください。",
      en: "A free trial isn't available for this account. Please purchase without the trial.",
      ko: "이 계정은 무료 체험을 이용할 수 없습니다. 체험 없이 구매해 주세요.",
      zh: "此账户无法使用免费试用。请不使用试用直接购买。",
      es: "La prueba gratuita no está disponible para esta cuenta. Compra sin prueba.",
      pt: "O teste gratuito não está disponível para esta conta. Compre sem o teste.",
      fr: "L'essai gratuit n'est pas disponible pour ce compte. Achetez sans essai.",
    }),
    planUnavailable: L(lang, {
      ja: "プラン情報を取得できませんでした。",
      en: "Couldn't load the plan details.",
      ko: "플랜 정보를 불러오지 못했습니다.",
      zh: "无法加载方案详情。",
      es: "No se pudieron cargar los detalles del plan.",
      pt: "Não foi possível carregar os detalhes do plano.",
      fr: "Impossible de charger les détails de l'abonnement.",
    }),
    pendingTitle: L(lang, {
      ja: "支払い待ち",
      en: "Payment pending",
      ko: "결제 대기 중",
      zh: "等待付款",
      es: "Pago pendiente",
      pt: "Pagamento pendente",
      fr: "Paiement en attente",
    }),
    pendingBody: L(lang, {
      ja: "お支払いが完了すると自動で Pro になります。",
      en: "Pro will be activated automatically once the payment is completed.",
      ko: "결제가 완료되면 자동으로 Pro가 됩니다.",
      zh: "付款完成后将自动开通 Pro。",
      es: "Pro se activará automáticamente cuando se complete el pago.",
      pt: "O Pro será ativado automaticamente quando o pagamento for concluído.",
      fr: "Pro sera activé automatiquement une fois le paiement effectué.",
    }),
    nothingToRestore: L(lang, {
      ja: "復元可能な購入がありません。",
      en: "There are no purchases to restore.",
      ko: "복원할 수 있는 구매가 없습니다.",
      zh: "没有可恢复的购买。",
      es: "No hay compras que restaurar.",
      pt: "Não há compras para restaurar.",
      fr: "Aucun achat à restaurer.",
    }),
    noValidPurchase: L(lang, {
      ja: "有効な購入が見つかりませんでした。",
      en: "No active purchase was found.",
      ko: "유효한 구매를 찾지 못했습니다.",
      zh: "未找到有效的购买。",
      es: "No se encontró una compra activa.",
      pt: "Nenhuma compra ativa foi encontrada.",
      fr: "Aucun achat actif trouvé.",
    }),
    restored: L(lang, {
      ja: "購入を復元しました。",
      en: "Your purchase has been restored.",
      ko: "구매를 복원했습니다.",
      zh: "已恢复购买。",
      es: "Tu compra se ha restaurado.",
      pt: "Sua compra foi restaurada.",
      fr: "Votre achat a été restauré.",
    }),
    restoreErrorTitle: L(lang, {
      ja: "エラー",
      en: "Error",
      ko: "오류",
      zh: "错误",
      es: "Error",
      pt: "Erro",
      fr: "Erreur",
    }),
    restoreFailed: L(lang, {
      ja: "復元に失敗しました。",
      en: "Restore failed.",
      ko: "복원에 실패했습니다.",
      zh: "恢复失败。",
      es: "No se pudo restaurar.",
      pt: "A restauração falhou.",
      fr: "Échec de la restauration.",
    }),
  };
}

function androidSubscriptionOffers(products: CatalogItem[], sku: string) {
  const item = products.find((p) => p.productId === sku) as
    | Partial<SubscriptionAndroid>
    | undefined;
  return item?.subscriptionOfferDetails ?? [];
}

/**
 * Google Play 定期購入は offerToken 必須。
 * 無料トライアル（offerId あり）は対象者にだけ返る。trial=false は基本プラン（offerId なし）。
 */
function androidOfferToken(
  products: CatalogItem[],
  sku: string,
  trial: boolean
): string | null {
  const offers = androidSubscriptionOffers(products, sku);
  const offer = trial
    ? offers.find((o) => o.offerId != null)
    : (offers.find((o) => o.offerId == null) ?? offers[0]);
  return offer?.offerToken ?? null;
}

/** ストアの現地価格。定期購入は基本プランの最後の課金フェーズ（トライアル後の通常価格） */
function catalogPrice(products: CatalogItem[], sku: string): string | null {
  const item = products.find((p) => p.productId === sku) as
    | Record<string, unknown>
    | undefined;
  if (!item) return null;
  if (typeof item.localizedPrice === "string" && item.localizedPrice) {
    return item.localizedPrice;
  }
  const oneTime = item.oneTimePurchaseOfferDetails as
    | { formattedPrice?: string }
    | undefined;
  if (oneTime?.formattedPrice) return oneTime.formattedPrice;
  const offers = item.subscriptionOfferDetails as
    | Array<{
        offerId?: string | null;
        pricingPhases?: { pricingPhaseList?: Array<{ formattedPrice?: string }> };
      }>
    | undefined;
  const base = offers?.find((o) => o.offerId == null) ?? offers?.[0];
  const phases = base?.pricingPhases?.pricingPhaseList ?? [];
  return phases[phases.length - 1]?.formattedPrice ?? null;
}

/** endConnection は iOS の購入イベント送出を全体で止めるので、最後の利用者が外れたときだけ呼ぶ */
let iapConnectionUsers = 0;
let iapConnectionPromise: Promise<boolean> | null = null;
/** 購入はイベントと request の戻り値の両方で届くため、同じ取引を二重処理しない */
const handledPurchaseKeys = new Set<string>();

type PurchaseOutcome = "ok" | "pending" | "failed";

/** 購入画面が待っている結果。null のときに届いた購入（後から完了した支払い・未完了の取引）は黙って処理する */
let pendingPurchase: {
  resolve: (outcome: PurchaseOutcome) => void;
  lang: LocalizedLang;
} | null = null;

function settlePendingPurchase(outcome: PurchaseOutcome) {
  const waiter = pendingPurchase;
  pendingPurchase = null;
  waiter?.resolve(outcome);
}

function retainIapConnection(): { ready: Promise<boolean>; release: () => void } {
  iapConnectionUsers += 1;
  if (!iapConnectionPromise) {
    iapConnectionPromise = initConnection()
      .then(() => true)
      .catch(() => {
        iapConnectionPromise = null;
        return false;
      });
  }
  let released = false;
  return {
    ready: iapConnectionPromise,
    release: () => {
      if (released) return;
      released = true;
      iapConnectionUsers -= 1;
      if (iapConnectionUsers === 0) {
        iapConnectionPromise = null;
        void endConnection();
      }
    },
  };
}

function purchaseKey(purchase: ProductPurchase): string {
  return purchase.transactionId || purchase.purchaseToken || "";
}

function isAndroidPendingPurchase(purchase: ProductPurchase): boolean {
  return (
    Platform.OS === "android" &&
    purchase.purchaseStateAndroid === PurchaseStateAndroid.PENDING
  );
}

class IapVerifyPendingError extends Error {}

async function verifyOnServer(purchase: ProductPurchase): Promise<void> {
  const user = auth.currentUser;
  if (!user || !API_BASE) throw new Error("not ready");

  const token = await user.getIdToken();
  const endpoint =
    Platform.OS === "ios" ? "/api/iap/apple/verify" : "/api/iap/google/verify";

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      productId: purchase.productId,
      transactionReceipt: purchase.transactionReceipt,
      purchaseToken: purchase.purchaseToken,
      transactionId: purchase.transactionId,
      signedTransactionInfo:
        typeof (purchase as { signedTransactionInfo?: string })
          .signedTransactionInfo === "string"
          ? (purchase as { signedTransactionInfo?: string }).signedTransactionInfo
          : undefined,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (body?.error === "pending") throw new IapVerifyPendingError("pending");
    throw new Error("verify failed");
  }
  // 復元時の Android 購入は承認済みで、finishTransaction が reject する
  if (Platform.OS !== "android" || !purchase.isAcknowledgedAndroid) {
    await finishTransaction({ purchase, isConsumable: false }).catch((e) => {
      if (Platform.OS !== "android") throw e;
    });
  }
  invalidateProfileUserDocNative(user.uid);
}

async function handlePurchase(purchase: ProductPurchase): Promise<void> {
  if (!IAP_ALL_SKUS.includes(purchase.productId as (typeof IAP_ALL_SKUS)[number])) {
    return;
  }
  const waiter = pendingPurchase;
  if (isAndroidPendingPurchase(purchase)) {
    if (waiter) {
      settlePendingPurchase("pending");
      const copy = iapCopy(waiter.lang);
      cyberAlert(copy.pendingTitle, copy.pendingBody);
    }
    return;
  }
  const key = purchaseKey(purchase);
  if (key) {
    if (handledPurchaseKeys.has(key)) return;
    handledPurchaseKeys.add(key);
  }
  try {
    await verifyOnServer(purchase);
    settlePendingPurchase("ok");
  } catch (e) {
    if (key) handledPurchaseKeys.delete(key);
    const current = pendingPurchase;
    if (!current) return;
    const copy = iapCopy(current.lang);
    if (e instanceof IapVerifyPendingError) {
      settlePendingPurchase("pending");
      cyberAlert(copy.pendingTitle, copy.pendingBody);
      return;
    }
    settlePendingPurchase("failed");
    cyberAlert(copy.errorTitle, copy.verifyFailed);
  }
}

let listenerUsers = 0;
let listenerSubs: { remove: () => void }[] = [];

function retainPurchaseListeners(): () => void {
  listenerUsers += 1;
  if (listenerSubs.length === 0) {
    listenerSubs = [
      purchaseUpdatedListener((purchase) => {
        void handlePurchase(purchase);
      }),
      purchaseErrorListener((error: PurchaseError) => {
        const waiter = pendingPurchase;
        if (!waiter) return;
        settlePendingPurchase("failed");
        if (error.code === "E_USER_CANCELLED") return;
        const copy = iapCopy(waiter.lang);
        cyberAlert(copy.errorTitle, copy.purchaseFailed);
      }),
    ];
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listenerUsers -= 1;
    if (listenerUsers === 0) {
      for (const sub of listenerSubs) sub.remove();
      listenerSubs = [];
    }
  };
}

/**
 * Android は支払い保留（コンビニ払い等）が後から完了しても、購入画面が閉じていると誰も受け取らない。
 * 起動時に未承認の購入を拾ってサーバーへ送る（iOS は未完了の取引をリスナーへ再送するので不要）。
 */
async function processUnacknowledgedAndroidPurchases(): Promise<void> {
  if (Platform.OS !== "android") return;
  const purchases = await getAvailablePurchases().catch(() => []);
  for (const p of purchases) {
    if (p.isAcknowledgedAndroid) continue;
    if (p.purchaseStateAndroid !== PurchaseStateAndroid.PURCHASED) continue;
    await handlePurchase(p);
  }
}

/** メインタブに常駐させ、購入画面の外で届く購入（後払いの完了・検証に失敗した取引）を処理する */
export function useNativeIapBackgroundPurchases(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const conn = retainIapConnection();
    let releaseListeners: (() => void) | null = null;
    void conn.ready.then((ok) => {
      if (!alive || !ok) return;
      releaseListeners = retainPurchaseListeners();
      void processUnacknowledgedAndroidPurchases();
    });
    return () => {
      alive = false;
      releaseListeners?.();
      conn.release();
    };
  }, [enabled]);
}

export function useNativeIap(language?: string | null) {
  const lang = resolveLocalizedLang(language);
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let alive = true;
    const conn = retainIapConnection();
    let releaseListeners: (() => void) | null = null;
    void (async () => {
      try {
        if (!(await conn.ready)) throw new Error("iap connection failed");
        if (!alive) return;
        releaseListeners = retainPurchaseListeners();
        // iOS の react-native-iap は商品取得を 1 本しか保持せず、並列だと先行分が E_CANCELED になる
        const subs = await getSubscriptions({ skus: [...IAP_SUBSCRIPTION_SKUS] });
        const oneTime = await getProducts({ skus: [...IAP_ONE_TIME_SKUS] });
        if (alive) {
          setProducts([...subs, ...oneTime]);
          setReady(true);
        }
      } catch {
        if (alive) setReady(false);
      }
    })();
    return () => {
      alive = false;
      releaseListeners?.();
      conn.release();
    };
  }, []);

  /** Android はストアがトライアル対象者にだけ特典を返す。iOS / 未取得は null（判定不可） */
  const trialOfferAvailable = useCallback(
    (plan: ProIapPlan): boolean | null => {
      if (!isSubscriptionPlan(plan)) return false;
      if (Platform.OS !== "android" || !ready) return null;
      return androidOfferToken(products, productIdForPlan(plan), true) != null;
    },
    [ready, products]
  );

  const purchase = useCallback(
    async (plan: ProIapPlan, opts?: { trial?: boolean }) => {
      const copy = iapCopy(lang);
      if (purchasing) return false;
      if (!ready) {
        cyberAlert(copy.errorTitle, copy.storeUnavailable);
        return false;
      }
      setPurchasing(true);
      const trialTap = isSubscriptionPlan(plan) && opts?.trial === true;
      trackProPurchaseNative("purchase_tap", plan, trialTap);
      try {
        const sku = productIdForPlan(plan);
        let offerToken: string | null = null;
        if (Platform.OS === "android" && isSubscriptionPlan(plan)) {
          const trial = opts?.trial === true;
          offerToken = androidOfferToken(products, sku, trial);
          if (!offerToken) {
            cyberAlert(
              copy.errorTitle,
              trial ? copy.trialUnavailable : copy.planUnavailable
            );
            return false;
          }
        }
        const outcome = await new Promise<PurchaseOutcome>((resolve) => {
          settlePendingPurchase("failed");
          pendingPurchase = { resolve, lang };
          const req =
            Platform.OS === "android"
              ? offerToken
                ? requestSubscription({ subscriptionOffers: [{ sku, offerToken }] })
                : requestPurchase({ skus: [sku] })
              : isSubscriptionPlan(plan)
                ? requestSubscription({ sku })
                : requestPurchase({ sku });
          void req
            .then((result) => {
              const purchased = (Array.isArray(result) ? result[0] : result) as
                | ProductPurchase
                | null
                | undefined;
              if (purchased?.productId) void handlePurchase(purchased);
            })
            .catch(() => {
              if (pendingPurchase?.resolve === resolve) settlePendingPurchase("failed");
            });
        });
        const ok = outcome === "ok";
        if (ok) trackProPurchaseNative("purchase_done", plan, trialTap);
        return ok;
      } catch {
        cyberAlert(copy.errorTitle, copy.purchaseFailed);
        return false;
      } finally {
        setPurchasing(false);
      }
    },
    [lang, ready, purchasing, products]
  );

  const restore = useCallback(async () => {
    const copy = iapCopy(lang);
    if (!ready || purchasing) return false;
    setPurchasing(true);
    try {
      const purchases = await getAvailablePurchases();
      const valid = purchases.filter((p) =>
        IAP_ALL_SKUS.includes(p.productId as (typeof IAP_ALL_SKUS)[number])
      );
      if (valid.length === 0) {
        cyberAlert("", copy.nothingToRestore);
        return false;
      }
      // 期限切れの古い取引はサーバーが 409 を返すので、1 件でも通れば復元成功
      let restored = 0;
      for (const p of valid) {
        try {
          await verifyOnServer(p);
          restored += 1;
        } catch (err) {
          if (__DEV__) console.warn("[iap restore]", p.productId, err);
        }
      }
      if (restored === 0) {
        cyberAlert("", copy.noValidPurchase);
        return false;
      }
      cyberAlert("", copy.restored);
      return true;
    } catch {
      cyberAlert(copy.restoreErrorTitle, copy.restoreFailed);
      return false;
    } finally {
      setPurchasing(false);
    }
  }, [lang, ready, purchasing]);

  const storePrice = useCallback(
    (plan: ProIapPlan): string | null =>
      catalogPrice(products, productIdForPlan(plan)),
    [products]
  );

  return {
    ready,
    products,
    purchasing,
    purchase,
    restore,
    trialOfferAvailable,
    storePrice,
  };
}
