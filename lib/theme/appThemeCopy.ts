const APP_THEME_COPY = {
  ja: {
    section: "テーマ",
    hint: "背景と文字の明るさを切り替えます。切り替えるとアプリが再起動します。",
    dark: "ダーク",
    darkDesc: "黒地に白文字",
    light: "ライト",
    lightDesc: "明るい地に黒文字",
    confirmTitle: "アプリを再起動します",
    confirmBody: "テーマを切り替えるためにアプリを再起動します。",
    confirmCancel: "キャンセル",
    confirmOk: "再起動",
    manualRestart: "アプリを終了してもう一度開くと反映されます。",
  },
  en: {
    section: "THEME",
    hint: "Switch between dark and light. The app restarts to apply it.",
    dark: "Dark",
    darkDesc: "White text on black",
    light: "Light",
    lightDesc: "Dark text on a light background",
    confirmTitle: "Restart the app",
    confirmBody: "The app will restart to switch the theme.",
    confirmCancel: "Cancel",
    confirmOk: "Restart",
    manualRestart: "Close and reopen the app to apply it.",
  },
} as const;

export function appThemeCopy(language: string | null | undefined) {
  return language === "ja" ? APP_THEME_COPY.ja : APP_THEME_COPY.en;
}
