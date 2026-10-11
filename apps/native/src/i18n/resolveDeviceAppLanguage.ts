/**
 * 端末の設定言語 → アプリ言語。
 * OS の優先言語を先に見る。Hermes の Intl（多くは en-US）には落とさない。
 */
import {
  chineseScriptFromLocaleTag,
  guessChineseScriptFromDevice,
  languageFromLocaleTag,
  type ChineseScript,
} from "../../../../lib/i18n/language";
import {
  resolveAppUiLocalizedLang,
  type AppUiLanguage,
} from "../../../../lib/i18n/resolveAppUiLanguage";
import type { LocalizedLang } from "../../../../lib/i18n/localize";
import { readDeviceLocaleTag } from "./readDeviceLocaleTag";

export type NativeAppLanguage = AppUiLanguage;

export function resolveDeviceLocalizedLang(): LocalizedLang {
  const fromDevice = languageFromLocaleTag(readDeviceLocaleTag());
  if (fromDevice) return fromDevice;
  return resolveAppUiLocalizedLang();
}

/** ja 以外は en（未ログインの二値 UI 用） */
export function resolveDeviceAppLanguage(): NativeAppLanguage {
  return resolveDeviceLocalizedLang() === "ja" ? "ja" : "en";
}

export function guessDeviceChineseScript(): ChineseScript {
  return (
    chineseScriptFromLocaleTag(readDeviceLocaleTag()) ??
    guessChineseScriptFromDevice()
  );
}
