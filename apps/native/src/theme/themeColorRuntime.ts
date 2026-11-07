/**
 * 起動時に決めたテーマで色リテラルを写す（babel/themeColorLiteralsPlugin.js が呼ぶ）。
 * テーマはアプリ起動中は固定。切り替えは保存して再起動する。
 */
import {
  toLightThemeColor,
  type LightThemeColorRole,
} from "../../../../lib/theme/lightThemeColor";

export type AppThemeMode = "dark" | "light";

export const APP_THEME_MODE_STORAGE_KEY = "uniterz.appThemeMode";

let mode: AppThemeMode = "dark";
const cache = new Map<string, string>();
const CACHE_MAX = 4000;

export function setAppThemeModeAtBoot(next: AppThemeMode) {
  mode = next;
  cache.clear();
}

export function getAppThemeMode(): AppThemeMode {
  return mode;
}

export function isLightAppTheme(): boolean {
  return mode === "light";
}

export function parseAppThemeMode(raw: unknown): AppThemeMode {
  return raw === "light" ? "light" : "dark";
}

export function themeColor(color: string, role?: LightThemeColorRole): string {
  if (mode === "dark" || typeof color !== "string") return color;
  const key = role ? `${role}|${color}` : color;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const out = toLightThemeColor(color, role);
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(key, out);
  return out;
}

export { rawColor } from "../../../../lib/theme/rawColor";

/** ダーク・ライトで別の値を明示したいとき。両方のリテラルとも Babel は触らない */
export function themePick<T>(dark: T, light: T): T {
  return mode === "light" ? light : dark;
}

(globalThis as { __uzc?: typeof themeColor }).__uzc = themeColor;
