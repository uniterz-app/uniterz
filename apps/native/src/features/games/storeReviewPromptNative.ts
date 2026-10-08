/**
 * その日の予想を全部終えたあとに OS 標準のレビューダイアログを 1 回だけ出す。
 * 文言は OS 固定（独自の事前確認は出さない）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORE_REVIEW_REQUESTED_KEY = "uniterz.storeReviewRequested.v1";

type StoreReviewModule = {
  isAvailableAsync: () => Promise<boolean>;
  requestReview: () => Promise<void>;
};

/** expo-store-review を含まない同 runtimeVersion のバイナリへ EAS Update で届いても落ちないよう遅延 require */
function loadStoreReview(): StoreReviewModule | null {
  try {
    return require("expo-store-review") as StoreReviewModule;
  } catch {
    return null;
  }
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
