/**
 * 端末の設定言語 → アプリ言語（ja | en）。
 * `ja` / `ja-*` のみ日本語。それ以外は英語。
 */
export {
  resolveAppUiLanguage as resolveDeviceAppLanguage,
  /** 7 言語コピー用（ja|en に潰さない） */
  resolveAppUiLocalizedLang as resolveDeviceLocalizedLang,
  type AppUiLanguage as NativeAppLanguage,
} from "@/lib/i18n/resolveAppUiLanguage";
