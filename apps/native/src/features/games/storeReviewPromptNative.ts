/**
 * その日の予想を全部終えたあとに OS 標準のレビューダイアログを 1 回だけ出す。
 * 文言は OS 固定（独自の事前確認は出さない）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo";

const STORE_REVIEW_REQUESTED_KEY = "uniterz.storeReviewRequested.v1";

type StoreReviewNativeModule = {
  isAvailableAsync: () => Promise<boolean>;
  requestReview: () => Promise<void>;
};

/**
 * ネイティブ側だけを見る。`require("expo-store-review")` はモジュールの無いバイナリ（EAS Update 先）で
 * Metro が致命的エラーとして報告し、try/catch でも止められずアプリが落ちる。
 */
function loadStoreReview(): StoreReviewNativeModule | null {
  return requireOptionalNativeModule<StoreReviewNativeModule>("ExpoStoreReview");
}

export async function requestStoreReviewOnceNative(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(STORE_REVIEW_REQUESTED_KEY)) return;
    const StoreReview = loadStoreReview();
    if (!StoreReview || !(await StoreReview.isAvailableAsync())) return;
    await AsyncStorage.setItem(STORE_REVIEW_REQUESTED_KEY, String(Date.now()));
    await StoreReview.requestReview();
  } catch {
    /* 失敗しても予想フローは止めない */
  }
}
