/**
 * 保存済みテーマを読んでから App を require する。
 * 色リテラルはモジュール評価時に写されるため、App 側のモジュールはテーマ確定後に読む。
 */
import { useEffect, useState, type ComponentType } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ensureNativeSplashHeld } from "../bootstrap/nativeBootSplash";
import {
  APP_THEME_MODE_STORAGE_KEY,
  parseAppThemeMode,
  setAppThemeModeAtBoot,
} from "./themeColorRuntime";

ensureNativeSplashHeld();

export default function AppThemeBootNative() {
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(APP_THEME_MODE_STORAGE_KEY)
      .catch(() => null)
      .then((raw) => {
        const devTheme = __DEV__ ? process.env.EXPO_PUBLIC_DEV_THEME : undefined;
        const mode = parseAppThemeMode(devTheme || raw);
        setAppThemeModeAtBoot(mode);
        try {
          Appearance.setColorScheme(mode);
        } catch {
          /* 未対応ビルドではシステムの見た目のまま */
        }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require("../../App") as { default: ComponentType };
        if (alive) setApp(() => mod.default);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!App) return null;
  return <App />;
}
