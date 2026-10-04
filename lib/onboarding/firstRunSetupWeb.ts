/** 初期設定確認の pending（ユーザー別・localStorage） */
import { firstRunSetupPendingKey } from "@/lib/onboarding/firstRunSetup";
import type { PushNotificationPrefKey } from "@/lib/notifications/pushNotificationPrefs";

/** 初期設定で「通知を受け取らない」を選んだときにオフにする（Free で既定オンのもの） */
export const FREE_NOTIFICATION_PREF_KEYS_FOR_SETUP: readonly PushNotificationPrefKey[] = [
  "gameFinal",
  "predictionDeadline",
  "unitReward",
];

export function markFirstRunSetupPending(uid: string): void {
  try {
    window.localStorage.setItem(firstRunSetupPendingKey(uid), "1");
  } catch {
    // プライベートモード等は握りつぶす
  }
}

export function readFirstRunSetupPending(uid: string): boolean {
  try {
    return window.localStorage.getItem(firstRunSetupPendingKey(uid)) === "1";
  } catch {
    return false;
  }
}

export function clearFirstRunSetupPending(uid: string): void {
  try {
    window.localStorage.removeItem(firstRunSetupPendingKey(uid));
  } catch {
    // 握りつぶす
  }
}
