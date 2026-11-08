/** 表示設定のテーマ切り替え（ダーク / ライト）。保存して再起動で反映 */
import { useState } from "react";
import { Alert, DevSettings, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import { appThemeCopy } from "../../../../../lib/theme/appThemeCopy";
import {
  APP_THEME_MODE_STORAGE_KEY,
  getAppThemeMode,
  rawColor,
  type AppThemeMode,
} from "../../theme/themeColorRuntime";

async function restartApp(): Promise<boolean> {
  if (!__DEV__) {
    try {
      const Updates = require("expo-updates") as typeof import("expo-updates");
      if (Updates.isEnabled) {
        await Updates.reloadAsync();
        return true;
      }
    } catch {
      /* 下の DevSettings へ */
    }
  }
  try {
    DevSettings.reload();
    return true;
  } catch {
    return false;
  }
}

export default function AppThemeSettingsNative() {
  const { language } = useNativeLanguage();
  const copy = appThemeCopy(language);
  const current = getAppThemeMode();
  const [pending, setPending] = useState<AppThemeMode | null>(null);
  const selected = pending ?? current;

  const choose = (mode: AppThemeMode) => {
    if (mode === selected) return;
    Alert.alert(copy.confirmTitle, copy.confirmBody, [
      { text: copy.confirmCancel, style: "cancel" },
      {
        text: copy.confirmOk,
        onPress: () => {
          void (async () => {
            await AsyncStorage.setItem(APP_THEME_MODE_STORAGE_KEY, mode).catch(() => {});
            setPending(mode);
            const ok = await restartApp();
            if (!ok) Alert.alert(copy.manualRestart);
          })();
        },
      },
    ]);
  };

  const options: Array<{ mode: AppThemeMode; title: string; desc: string }> = [
    { mode: "dark", title: copy.dark, desc: copy.darkDesc },
    { mode: "light", title: copy.light, desc: copy.lightDesc },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{copy.section}</Text>
      <Text style={styles.sectionHint}>{copy.hint}</Text>
      <View style={styles.options}>
        {options.map((o) => {
          const on = o.mode === selected;
          return (
            <Pressable
              key={o.mode}
              onPress={() => choose(o.mode)}
              style={[styles.option, on && styles.optionOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: o.mode === "dark" ? rawColor("#070708") : rawColor("#D2DBDB") },
                ]}
              >
                <Text
                  style={[
                    styles.swatchText,
                    { color: o.mode === "dark" ? rawColor("#F4F7FF") : rawColor("#122022") },
                  ]}
                >
                  Aa
                </Text>
              </View>
              <Text style={[styles.optionTitle, on && styles.optionTitleOn]}>{o.title}</Text>
              <Text style={styles.optionDesc}>{o.desc}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: "#a5f3fc",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 10,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 15,
  },
  options: {
    flexDirection: "row",
    gap: 10,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  optionOn: {
    borderColor: "#22d3ee",
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  swatch: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 4,
  },
  swatchText: {
    fontSize: 16,
    fontWeight: "800",
  },
  optionTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  optionTitleOn: {
    color: "#67e8f9",
  },
  optionDesc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 15,
  },
});
