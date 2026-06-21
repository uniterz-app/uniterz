/** expo-notifications のネイティブ有無を確認してから遅延ロード */
import { requireOptionalNativeModule } from "expo-modules-core";

type ExpoNotificationsModule = typeof import("expo-notifications");

let cached: ExpoNotificationsModule | null | undefined;

/** dev-client に ExpoPushTokenManager が含まれるか（prebuild / run:ios 後に true） */
export function isExpoPushNotificationsNativeAvailable(): boolean {
  return requireOptionalNativeModule("ExpoPushTokenManager") != null;
}

export async function loadExpoNotificationsModule(): Promise<ExpoNotificationsModule | null> {
  if (cached !== undefined) return cached;
  if (!isExpoPushNotificationsNativeAvailable()) {
    if (__DEV__) {
      console.warn(
        "[push] ExpoPushTokenManager が見つかりません。expo-notifications 追加後は dev-client の再ビルドが必要です: npm run native:ios"
      );
    }
    cached = null;
    return null;
  }

  try {
    const mod = await import("expo-notifications");
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    cached = mod;
    return mod;
  } catch (err) {
    if (__DEV__) {
      console.warn("[push] expo-notifications の読み込みに失敗", err);
    }
    cached = null;
    return null;
  }
}
