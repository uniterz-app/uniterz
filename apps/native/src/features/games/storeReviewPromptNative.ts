/**
 * OS 標準のレビューダイアログ（文言は OS 固定。独自の事前確認は出さない）。
 * 出す条件は `lib/app/storeReviewMoment.ts`、出す場所は `StoreReviewLaunchHostNative`。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo";

/** 値は依頼した時刻（ms）。v1 から同じキー */
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

export async function readStoreReviewLastRequestedAtNative(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORE_REVIEW_REQUESTED_KEY);
    const ms = raw == null ? NaN : Number(raw);
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

/** 依頼できたら true（OS が実際に表示したかは分からない） */
export async function requestStoreReviewNative(): Promise<boolean> {
  try {
    const StoreReview = loadStoreReview();
    if (!StoreReview || !(await StoreReview.isAvailableAsync())) return false;
    await AsyncStorage.setItem(STORE_REVIEW_REQUESTED_KEY, String(Date.now()));
    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
