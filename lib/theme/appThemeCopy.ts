const APP_THEME_COPY = {
  ja: {
    pageDescription: "背景を黒地か白地から選べます",
    section: "背景",
    hint: "切り替えるとアプリが再起動します。",
    dark: "黒地",
    darkDesc: "黒い背景に白い文字",
    light: "白地",
    lightDesc: "明るい背景に黒い文字。目が疲れにくい",
    confirmTitle: "アプリを再起動します",
    confirmBody: "背景を切り替えるためにアプリを再起動します。",
    confirmCancel: "キャンセル",
    confirmOk: "再起動",
    manualRestart: "アプリを終了してもう一度開くと反映されます。",
  },
  en: {
    pageDescription: "Choose a dark or light background",
    section: "BACKGROUND",
    hint: "The app restarts to apply it.",
    dark: "Dark",
    darkDesc: "White text on black",
    light: "Light",
    lightDesc: "Dark text on a light background. Easier on the eyes",
    confirmTitle: "Restart the app",
    confirmBody: "The app will restart to switch the background.",
    confirmCancel: "Cancel",
    confirmOk: "Restart",
    manualRestart: "Close and reopen the app to apply it.",
  },
} as const;

export function appThemeCopy(language: string | null | undefined) {
  return language === "ja" ? APP_THEME_COPY.ja : APP_THEME_COPY.en;
}
