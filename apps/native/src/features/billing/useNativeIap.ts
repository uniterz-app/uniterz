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

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type CatalogItem = Subscription | Product;

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
      }),
    });
    if (!res.ok) throw new Error("verify failed");
    await finishTransaction({ purchase, isConsumable: false });
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await initConnection();
        const [subs, oneTime] = await Promise.all([
          getSubscriptions({ skus: [...IAP_SUBSCRIPTION_SKUS] }),
          getProducts({ skus: [...IAP_ONE_TIME_SKUS] }),
        ]);
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
      void endConnection();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const successSub = purchaseUpdatedListener(async (purchase) => {
      if (!IAP_ALL_SKUS.includes(purchase.productId as (typeof IAP_ALL_SKUS)[number])) {
        return;
      }
      try {
        await verifyOnServer(purchase);
        pendingResolveRef.current?.(true);
      } catch {
        pendingResolveRef.current?.(false);
        cyberAlert("購入エラー", "購入の検証に失敗しました。");
      } finally {
        pendingResolveRef.current = null;
        setPurchasing(false);
      }
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
  }, [ready, verifyOnServer]);

  const purchase = useCallback(
    async (plan: ProIapPlan) => {
      if (!ready || purchasing) return false;
      setPurchasing(true);
      try {
        const sku = productIdForPlan(plan);
        return await new Promise<boolean>((resolve) => {
          pendingResolveRef.current = resolve;
          const req = isSubscriptionPlan(plan)
            ? requestSubscription({ sku })
            : requestPurchase({ sku });
          void req.catch(() => {
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
    [ready, purchasing]
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
      for (const p of valid) {
        await verifyOnServer(p);
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

  return { ready, products, purchasing, purchase, restore };
}
