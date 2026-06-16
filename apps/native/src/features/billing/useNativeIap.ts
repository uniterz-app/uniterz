import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
  type Subscription,
  type PurchaseError,
} from "react-native-iap";
import { IAP_PRODUCT_IDS, type IapPlan, productIdForPlan } from "./iapProductIds";
import { auth } from "../../lib/firebase";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

const SKU_LIST = Object.values(IAP_PRODUCT_IDS);

export function useNativeIap() {
  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Subscription[]>([]);
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
        const subs = await getSubscriptions({ skus: SKU_LIST });
        if (alive) {
          setProducts(subs);
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
      if (!SKU_LIST.includes(purchase.productId as (typeof SKU_LIST)[number])) return;
      try {
        await verifyOnServer(purchase);
        pendingResolveRef.current?.(true);
      } catch {
        pendingResolveRef.current?.(false);
        Alert.alert("購入エラー", "購入の検証に失敗しました。");
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
      Alert.alert("購入エラー", "購入処理に失敗しました。");
    });

    return () => {
      successSub.remove();
      errorSub.remove();
    };
  }, [ready, verifyOnServer]);

  const purchase = useCallback(
    async (plan: IapPlan) => {
      if (!ready || purchasing) return false;
      setPurchasing(true);
      try {
        const sku = productIdForPlan(plan);
        return await new Promise<boolean>((resolve) => {
          pendingResolveRef.current = resolve;
          void requestSubscription({ sku }).catch(() => {
            pendingResolveRef.current = null;
            setPurchasing(false);
            resolve(false);
          });
        });
      } catch {
        setPurchasing(false);
        Alert.alert("購入エラー", "購入処理に失敗しました。");
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
        SKU_LIST.includes(p.productId as (typeof SKU_LIST)[number])
      );
      if (valid.length === 0) {
        Alert.alert("", "復元可能な購入がありません。");
        return false;
      }
      for (const p of valid) {
        await verifyOnServer(p);
      }
      Alert.alert("", "購入を復元しました。");
      return true;
    } catch {
      Alert.alert("エラー", "復元に失敗しました。");
      return false;
    } finally {
      setPurchasing(false);
    }
  }, [ready, purchasing, verifyOnServer]);

  return { ready, products, purchasing, purchase, restore };
}
