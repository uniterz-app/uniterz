/**
 * 広告の同意（EU / イギリス / スイス の UMP）と、広告 SDK の初期化の入口。
 *
 * - 起動時に同意の状態を更新し、必要なら同意フォームを出す（AdMob の GDPR メッセージ）
 * - 同意の後に、iOS のトラッキング許可（ATT）を、未回答のときだけ出す
 * - ATT のあとに mobileAds を初期化する（Meta アダプタは iOS 17+ で ATT を自分で読む）
 * - 広告を出してよい（canRequestAds）ときだけ mobileAds を初期化する
 * - 同意の確認が失敗したら広告は出さない（安全側）
 * - 設定画面の「広告の同意を変更」（取り消しリンク）は、EU などの地域だけ出す
 *
 * 広告・ATT のネイティブ部分がバイナリに無いビルド（古いビルド・Expo Go）でも起動は止めない。
 * そのため、SDK は import せず、使うときだけ読み込む。
 */
import { Platform, TurboModuleRegistry } from "react-native";
import type { AdsConsentInfo } from "react-native-google-mobile-ads";

type AdsModuleNative = typeof import("react-native-google-mobile-ads");
type TrackingModuleNative = typeof import("expo-tracking-transparency");

/** ネイティブに AdMob が入っているか。無いのに require すると赤いエラーになる */
function hasGoogleMobileAdsNative(): boolean {
  try {
    return TurboModuleRegistry.get("RNGoogleMobileAdsModule") != null;
  } catch {
    return false;
  }
}

/** 広告 SDK を読み込む。ネイティブ部分が無いビルドでは null（例外で起動を止めない） */
export function loadAdsModuleNative(): AdsModuleNative | null {
  if (!hasGoogleMobileAdsNative()) return null;
  try {
    return require("react-native-google-mobile-ads") as AdsModuleNative;
  } catch {
    return null;
  }
}

/** ATT（トラッキング許可）のモジュールを読み込む。無いビルドでは null */
function loadTrackingModuleNative(): TrackingModuleNative | null {
  try {
    return require("expo-tracking-transparency") as TrackingModuleNative;
  } catch {
    return null;
  }
}

/**
 * iOS のトラッキング許可。未回答のときだけダイアログを出す（回答済みなら何もしない）。
 * 拒否されても広告は止めない（広告は非個人向けの扱いになるだけ）。
 */
async function requestTrackingPermissionNative(): Promise<void> {
  if (Platform.OS !== "ios") return;
  const tracking = loadTrackingModuleNative();
  if (!tracking) return;
  try {
    const current = await tracking.getTrackingPermissionsAsync();
    if (current.status === "undetermined") {
      await tracking.requestTrackingPermissionsAsync();
    }
  } catch {
    // 失敗しても起動と広告は続ける
  }
}

let readyPromise: Promise<boolean> | null = null;

/** 同意の確認 → 必要なら同意フォーム → ATT → 広告 SDK の初期化。広告を出してよいときだけ true。1 回だけ実行する。 */
export function ensureAdsReadyNative(): Promise<boolean> {
  if (!readyPromise) readyPromise = runConsentThenInitNative();
  return readyPromise;
}

/** iOS シミュレータ / Android エミュレータ。実機の同意フローは通す。 */
function isEmulatorNative(): boolean {
  try {
    const Device = require("expo-device") as { isDevice?: boolean };
    return Device.isDevice === false;
  } catch {
    return false;
  }
}

async function runConsentThenInitNative(): Promise<boolean> {
  const ads = loadAdsModuleNative();
  if (!ads) return false;
  try {
    // シミュレータの UMP / ATT はネイティブダイアログで画面を塞ぐ。実機の同意フローはそのまま。
    if (isEmulatorNative()) {
      await ads.default().initialize();
      return true;
    }
    await ads.AdsConsent.requestInfoUpdate();
    const info: AdsConsentInfo = await ads.AdsConsent.loadAndShowConsentFormIfRequired();
    if (!info.canRequestAds) return false;
    await requestTrackingPermissionNative();
    await ads.default().initialize();
    return true;
  } catch {
    return false;
  }
}

/**
 * 設定画面に「広告の同意を変更」を出すか。
 * EU などで同意の変更の入口が必要な地域のユーザーだけ true。
 */
export async function adsPrivacyOptionsRequiredNative(): Promise<boolean> {
  const ads = loadAdsModuleNative();
  if (!ads) return false;
  try {
    const info: AdsConsentInfo = await ads.AdsConsent.getConsentInfo();
    return String(info.privacyOptionsRequirementStatus) === "REQUIRED";
  } catch {
    return false;
  }
}

/** 広告の同意を変更するフォームを開く（取り消しリンク） */
export async function showAdsPrivacyOptionsNative(): Promise<boolean> {
  const ads = loadAdsModuleNative();
  if (!ads) return false;
  try {
    await ads.AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}
