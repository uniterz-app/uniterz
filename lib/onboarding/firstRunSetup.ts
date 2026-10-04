/**
 * 新規登録直後の初期設定確認（通知・スコア表示）。
 * プロフィール設定完了時に端末へ pending を立て、試合ページ着地時に 1 回だけ出す。
 */
export const FIRST_RUN_SETUP_PENDING_KEY_PREFIX = "uniterz:firstRunSetupPending:v1:";

export function firstRunSetupPendingKey(uid: string): string {
  return `${FIRST_RUN_SETUP_PENDING_KEY_PREFIX}${uid}`;
}

export const FIRST_RUN_SETUP_COPY = {
  ja: {
    title: "はじめる前に",
    body: "あとから「表示設定」「通知設定」でいつでも変えられます",
    notifySection: "通知",
    notifyTitle: "通知を受け取る",
    notifyDesc: "予想の締切前・試合終了・Unit 獲得をお知らせします",
    notifyWebHint: "通知はアプリで届きます",
    scoreSection: "スコア表示",
    start: "はじめる",
  },
  en: {
    title: "BEFORE YOU START",
    body: "You can change these anytime in Display and Notifications settings",
    notifySection: "NOTIFICATIONS",
    notifyTitle: "Get notifications",
    notifyDesc: "Prediction deadlines, final results, and Unit rewards",
    notifyWebHint: "Notifications are delivered in the app",
    scoreSection: "SCORE DISPLAY",
    start: "Start",
  },
} as const;

export function firstRunSetupCopy(language: string | null | undefined) {
  return language === "ja" ? FIRST_RUN_SETUP_COPY.ja : FIRST_RUN_SETUP_COPY.en;
}
