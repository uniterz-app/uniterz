/**
 * OS の優先言語。Hermes の Intl は端末言語を見ず en-US になるため、こちらを先に使う。
 * iOS は Settings の AppleLanguages、Android は I18nManager.localeIdentifier。
 */
import { I18nManager, Platform, Settings } from "react-native";

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

export function readDeviceLocaleTag(): string | null {
  try {
    if (Platform.OS === "ios") {
      const languages = firstString(Settings.get("AppleLanguages"));
      if (languages) return languages;
      const locale = firstString(Settings.get("AppleLocale"));
      if (locale) return locale;
    }
    if (Platform.OS === "android") {
      const id = I18nManager.getConstants().localeIdentifier;
      if (typeof id === "string" && id.trim()) return id.trim();
    }
  } catch {
    // 取得できない端末は呼び出し側がブラウザ推定へ落とす
  }
  return null;
}
