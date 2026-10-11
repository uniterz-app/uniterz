/**
 * 繁体字表示。文言は `zh`（簡体字）で持ち、字体が `hant` のときだけ表示直前に台湾式繁体字へ変換する。
 * `Text` / `TextInput` / `Alert` は `src/shims/reactNativeFontScaleCap.js` がここを通す。
 * 純 JS（opencc-js）なので OTA で入る。辞書（約 1MB）は hant になったときだけ読む。
 * このモジュールから `react-native` を import しない（シムとの循環になる）。
 */
import { createContext, createElement, useSyncExternalStore, type ReactNode } from "react";
import {
  guessChineseScriptFromDevice,
  NO_CHINESE_SCRIPT_CONVERT,
  type ChineseScript,
} from "../../../../lib/i18n/language";

let activeScript: ChineseScript = guessChineseScriptFromDevice();
const listeners = new Set<() => void>();

export function getActiveChineseScript(): ChineseScript {
  return activeScript;
}

export function setActiveChineseScript(script: ChineseScript): void {
  if (script === activeScript) return;
  activeScript = script;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const ChineseScriptContext = createContext<ChineseScript>(activeScript);

/** アプリ最上位に 1 つ。字体が変わると `Text` が再描画される */
export function ChineseScriptProviderNative({ children }: { children: ReactNode }) {
  const script = useSyncExternalStore(subscribe, getActiveChineseScript);
  return createElement(ChineseScriptContext.Provider, { value: script }, children);
}

type Converter = (text: string) => string;
let converter: Converter | null = null;

function getConverter(): Converter {
  if (converter) return converter;
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { ConverterFactory } = require("opencc-js/core") as {
    ConverterFactory: (...groups: unknown[]) => Converter;
  };
  const fromCn = (require("opencc-js/from/cn") as { default: unknown }).default;
  const toTwp = (require("opencc-js/to/twp") as { default: unknown }).default;
  /* eslint-enable @typescript-eslint/no-require-imports */
  converter = ConverterFactory(fromCn, toTwp);
  return converter;
}

const HAN = /[\u3400-\u9fff]/;
const KANA = /[\u3040-\u30ff]/;
const CACHE_LIMIT = 4000;
const cache = new Map<string, string>();

/**
 * 簡体字 → 台湾式繁体字。漢字なし・かな混じり（日本語の投稿や選手名）・停止印付きはそのまま。
 */
export function toTraditionalChinese(text: string): string {
  if (!HAN.test(text) || KANA.test(text) || text.startsWith(NO_CHINESE_SCRIPT_CONVERT)) {
    return text;
  }
  const hit = cache.get(text);
  if (hit !== undefined) return hit;
  let out = text;
  try {
    out = getConverter()(text);
  } catch {
    out = text;
  }
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(text, out);
  return out;
}

export function convertForChineseScript(text: string, script: ChineseScript): string {
  return script === "hant" ? toTraditionalChinese(text) : text;
}
