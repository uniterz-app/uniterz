/**
 * users/{uid}/private/* — 本人だけが読む・書く設定（公開 users ルートから外す）。
 * Firestore ルール: auth.uid == userId のみ。
 */
export const USER_PRIVATE_NOTIFICATION_PREFS_DOC = "notificationPrefs";
/** 試合カードのスコア表示設定（lib/games/matchScoreDisplayPrefs） */
export const USER_PRIVATE_DISPLAY_PREFS_DOC = "displayPrefs";

export function userPrivateNotificationPrefsPath(uid: string): [string, string, string, string] {
  return ["users", uid, "private", USER_PRIVATE_NOTIFICATION_PREFS_DOC];
}
