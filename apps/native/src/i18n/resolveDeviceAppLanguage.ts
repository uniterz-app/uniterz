/**
 * 端末の設定言語 → アプリ言語（ja | en）。
 * `ja` / `ja-*` のみ日本語。それ以外は英語。
 */
export {
  resolveAppUiLanguage as resolveDeviceAppLanguage,
  type AppUiLanguage as NativeAppLanguage,
} from "@/lib/i18n/resolveAppUiLanguage";
