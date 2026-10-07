import { useCallback, useEffect, useRef, useState } from "react";
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

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type CatalogItem = Subscription | Product;

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
/** 購入はイベントと request の戻り値の両方で届くため、同じ取引を二重処理しない */
const handledPurchaseKeys = new Set<string>();

function purchaseKey(purchase: ProductPurchase): string {
  return purchase.transactionId || purchase.purchaseToken || "";
}

export function useNativeIap() {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const pendingResolveRef = useRef<((ok: boolean) => void) | null>(null);

  const verifyOnServer = useCallback(async (purchase: ProductPurchase) => {
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
    if (!res.ok) throw new Error("verify failed");
    // 復元時の Android 購入は承認済みで、finishTransaction が reject する
    if (Platform.OS !== "android" || !purchase.isAcknowledgedAndroid) {
      await finishTransaction({ purchase, isConsumable: false }).catch((e) => {
        if (Platform.OS !== "android") throw e;
      });
    }
    const uid = user.uid;
    if (uid) invalidateProfileUserDocNative(uid);
  }, []);

  const handlePurchase = useCallback(
    async (purchase: ProductPurchase) => {
      if (!IAP_ALL_SKUS.includes(purchase.productId as (typeof IAP_ALL_SKUS)[number])) {
        return;
      }
      const key = purchaseKey(purchase);
      if (key) {
        if (handledPurchaseKeys.has(key)) return;
        handledPurchaseKeys.add(key);
      }
      try {
        await verifyOnServer(purchase);
        pendingResolveRef.current?.(true);
      } catch {
        if (key) handledPurchaseKeys.delete(key);
        pendingResolveRef.current?.(false);
        cyberAlert("購入エラー", "購入の検証に失敗しました。");
      } finally {
        pendingResolveRef.current = null;
        setPurchasing(false);
      }
    },
    [verifyOnServer]
  );

  useEffect(() => {
    let alive = true;
    iapConnectionUsers += 1;
    void (async () => {
      try {
        await initConnection();
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
      iapConnectionUsers -= 1;
      if (iapConnectionUsers === 0) void endConnection();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const successSub = purchaseUpdatedListener((purchase) => {
      void handlePurchase(purchase);
    });

    const errorSub = purchaseErrorListener((error: PurchaseError) => {
      if (error.code === "E_USER_CANCELLED") {
        pendingResolveRef.current?.(false);
        pendingResolveRef.current = null;
        setPurchasing(false);
        return;
      }
      pendingResolveRef.current?.(false);
      pendingResolveRef.current = null;
      setPurchasing(false);
      cyberAlert("購入エラー", "購入処理に失敗しました。");
    });

    return () => {
      successSub.remove();
      errorSub.remove();
    };
  }, [ready, handlePurchase]);

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
      if (purchasing) return false;
      if (!ready) {
        cyberAlert("購入エラー", "ストアに接続できませんでした。時間をおいて再度お試しください。");
        return false;
      }
      setPurchasing(true);
      try {
        const sku = productIdForPlan(plan);
        let offerToken: string | null = null;
        if (Platform.OS === "android" && isSubscriptionPlan(plan)) {
          const trial = opts?.trial === true;
          offerToken = androidOfferToken(products, sku, trial);
          if (!offerToken) {
            setPurchasing(false);
            cyberAlert(
              "購入エラー",
              trial
                ? "このアカウントでは無料お試しを利用できません。お試しなしで購入してください。"
                : "プラン情報を取得できませんでした。"
            );
            return false;
          }
        }
        return await new Promise<boolean>((resolve) => {
          pendingResolveRef.current = resolve;
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
              pendingResolveRef.current = null;
              setPurchasing(false);
              resolve(false);
            });
        });
      } catch {
        setPurchasing(false);
        cyberAlert("購入エラー", "購入処理に失敗しました。");
        return false;
      }
    },
    [ready, purchasing, products, handlePurchase]
  );

  const restore = useCallback(async () => {
    if (!ready || purchasing) return false;
    setPurchasing(true);
    try {
      const purchases = await getAvailablePurchases();
      const valid = purchases.filter((p) =>
        IAP_ALL_SKUS.includes(p.productId as (typeof IAP_ALL_SKUS)[number])
      );
      if (valid.length === 0) {
        cyberAlert("", "復元可能な購入がありません。");
        return false;
      }
      // 期限切れの古い取引はサーバーが 409 を返すので、1 件でも通れば復元成功
      let restored = 0;
      for (const p of valid) {
        try {
          await verifyOnServer(p);
          restored += 1;
        } catch (err) {
          console.warn("[iap restore]", p.productId, err);
        }
      }
      if (restored === 0) {
        cyberAlert("", "有効な購入が見つかりませんでした。");
        return false;
      }
      cyberAlert("", "購入を復元しました。");
      return true;
    } catch {
      cyberAlert("エラー", "復元に失敗しました。");
      return false;
    } finally {
      setPurchasing(false);
    }
  }, [ready, purchasing, verifyOnServer]);

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
