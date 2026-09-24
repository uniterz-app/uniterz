/**
 * RN 0.81+ 向け react-native-iap パッチ（npm install 後）。
 * - iOS: RCT-Folly 単体 Pod が無く pod install が失敗するため podspec を更新
 * - Android: currentActivity プロパティ削除に追従
 * - Android: Play Billing Library を 8.0.0 以上に（Play Console 要件）
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const iapRoot = path.join(root, "node_modules/react-native-iap");

/** Google Play が要求する最低 Billing（2026〜） */
const PLAY_BILLING_SDK_VERSION = "8.0.0";

function patchPodspec() {
  const podspecPath = path.join(iapRoot, "RNIap.podspec");
  if (!existsSync(podspecPath)) return;

  const patchedBlock = `  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\\"$(PODS_ROOT)/boost\\"",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    }
    install_modules_dependencies(s)
  end`;

  let src = readFileSync(podspecPath, "utf8");
  if (src.includes("install_modules_dependencies(s)") && !src.includes('s.dependency "RCT-Folly"')) {
    return;
  }

  const next = src.replace(
    /  # Don't install the dependencies[\s\S]*?s\.dependency "ReactCommon\/turbomodule\/core"\s*\n  end/m,
    patchedBlock
  );
  if (next === src) return;
  writeFileSync(podspecPath, next);
  console.log("[patch-rniap] RNIap.podspec を更新しました");
}

function patchAndroidKotlin() {
  const ktPath = path.join(
    iapRoot,
    "android/src/play/java/com/dooboolab/rniap/RNIapModule.kt"
  );
  if (!existsSync(ktPath)) return;

  let src = readFileSync(ktPath, "utf8");
  let changed = false;

  if (src.includes("val activity = currentActivity")) {
    src = src.replaceAll(
      "val activity = currentActivity",
      "val activity = reactApplicationContext.currentActivity"
    );
    changed = true;
  }

  // Billing Library 8+: enablePendingPurchases() は PendingPurchasesParams 必須
  if (
    src.includes(".enablePendingPurchases()") &&
    !src.includes("PendingPurchasesParams")
  ) {
    if (!src.includes("import com.android.billingclient.api.PendingPurchasesParams")) {
      src = src.replace(
        "import com.android.billingclient.api.BillingClient\n",
        "import com.android.billingclient.api.BillingClient\nimport com.android.billingclient.api.PendingPurchasesParams\n"
      );
    }
    src = src.replace(
      "BillingClient.newBuilder(reactContext).enablePendingPurchases()",
      "BillingClient.newBuilder(reactContext).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())"
    );
    changed = true;
  }

  // Billing Library 8+: queryPurchaseHistoryAsync 削除 → queryPurchasesAsync
  if (src.includes("queryPurchaseHistoryAsync")) {
    src = src.replace(
      /import com\.android\.billingclient\.api\.PurchaseHistoryRecord\n/,
      ""
    );
    src = src.replace(
      /import com\.android\.billingclient\.api\.QueryPurchaseHistoryParams\n/,
      ""
    );

    const historyFn =
      /@ReactMethod\n\s*fun getPurchaseHistoryByType\([\s\S]*?promise\.safeResolve\(items\)\n\s*\}\n\s*\}\n\s*\}/;

    const replacement = `@ReactMethod
    fun getPurchaseHistoryByType(
        type: String,
        promise: Promise,
    ) {
        // Billing Library 8 で queryPurchaseHistoryAsync が削除されたため、
        // 有効な購入のみ返す queryPurchasesAsync にフォールバックする。
        ensureConnection(
            promise,
        ) { billingClient ->
            billingClient.queryPurchasesAsync(
                QueryPurchasesParams
                    .newBuilder()
                    .setProductType(
                        if (type == "subs") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP,
                    ).build(),
            ) { billingResult: BillingResult, purchaseList: List<Purchase>? ->
                if (!isValidResult(billingResult, promise)) return@queryPurchasesAsync

                Log.d(TAG, purchaseList.toString())
                val items = Arguments.createArray()
                purchaseList?.forEach { purchase ->
                    val item = Arguments.createMap()
                    item.putString("productId", purchase.products[0])
                    val products = Arguments.createArray()
                    purchase.products.forEach { products.pushString(it) }
                    item.putArray("productIds", products)
                    item.putDouble("transactionDate", purchase.purchaseTime.toDouble())
                    item.putString("transactionReceipt", purchase.originalJson)
                    item.putString("purchaseToken", purchase.purchaseToken)
                    item.putString("dataAndroid", purchase.originalJson)
                    item.putString("signatureAndroid", purchase.signature)
                    item.putString("developerPayload", "")
                    items.pushMap(item)
                }
                promise.safeResolve(items)
            }
        }
    }`;

    const next = src.replace(historyFn, replacement);
    if (next !== src) {
      src = next;
      changed = true;
    }
  }

  // Billing Library 8+: queryProductDetailsAsync の第2引数が QueryProductDetailsResult に変更
  if (
    src.includes("queryProductDetailsAsync(params) { billingResult, skuDetailsList ->")
  ) {
    src = src.replace(
      "billingClient.queryProductDetailsAsync(params) { billingResult, skuDetailsList ->\n                if (!isValidResult(billingResult, promise)) return@queryProductDetailsAsync\n\n                val items = Arguments.createArray()\n                for (skuDetails in skuDetailsList) {",
      "billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsResult ->\n                if (!isValidResult(billingResult, promise)) return@queryProductDetailsAsync\n\n                val skuDetailsList = productDetailsResult.productDetailsList\n                val items = Arguments.createArray()\n                for (skuDetails in skuDetailsList) {"
    );
    changed = true;
  }

  // Purchase.developerPayload は旧 API。空文字に置換
  if (src.includes("purchase.developerPayload")) {
    src = src.replaceAll(
      'item.putString("developerPayloadAndroid", purchase.developerPayload)',
      'item.putString("developerPayloadAndroid", "")'
    );
    changed = true;
  }

  if (!changed) return;
  writeFileSync(ktPath, src);
  console.log("[patch-rniap] RNIapModule.kt を更新しました（RN 0.81 / Billing 8）");
}

function patchPlayBillingSdkVersion() {
  const propsPath = path.join(iapRoot, "android/gradle.properties");
  if (!existsSync(propsPath)) return;

  let src = readFileSync(propsPath, "utf8");
  const next = src.replace(
    /RNIap_playBillingSdkVersion=\S+/g,
    `RNIap_playBillingSdkVersion=${PLAY_BILLING_SDK_VERSION}`
  );
  if (next === src) {
    if (src.includes(`RNIap_playBillingSdkVersion=${PLAY_BILLING_SDK_VERSION}`)) {
      return;
    }
    return;
  }
  writeFileSync(propsPath, next);
  console.log(
    `[patch-rniap] Play Billing SDK を ${PLAY_BILLING_SDK_VERSION} に更新しました`
  );
}

patchPodspec();
patchAndroidKotlin();
patchPlayBillingSdkVersion();
