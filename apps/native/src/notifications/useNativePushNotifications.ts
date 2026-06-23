/** Native 専用 OS プッシュ — 権限・トークン登録・タップ遷移（Web 版は非対象） */
import { useEffect, useRef } from "react";
import { parsePushNotificationData } from "@/lib/notifications/pushPayloadTypes";
import {
  getCachedExpoPushToken,
  registerNativePushTokenFlow,
  registerNativePushTokenIfGranted,
  unregisterPushTokenFromApiNative,
} from "./registerPushTokenNative";
import { navigateFromPushNotificationData } from "./notificationNavigationNative";
import { loadExpoNotificationsModule } from "./expoNotificationsModuleNative";
import type { NotificationResponse } from "expo-notifications";

function extractPushDataFromResponse(
  response: NotificationResponse
): ReturnType<typeof parsePushNotificationData> {
  const raw = response.notification.request.content.data as Record<string, unknown>;
  return parsePushNotificationData(raw);
}

export function useNativePushNotifications(enabled: boolean) {
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    (async () => {
      try {
        await registerNativePushTokenIfGranted();
        if (!cancelled) registeredRef.current = true;
      } catch (err) {
        console.warn("[push] register failed", err);
      }
    })();

    return () => {
      cancelled = true;
      const token = getCachedExpoPushToken();
      if (token) {
        void unregisterPushTokenFromApiNative(token);
      }
      registeredRef.current = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let subResponse: { remove: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      const Notifications = await loadExpoNotificationsModule();
      if (!Notifications || cancelled) return;

      subResponse = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = extractPushDataFromResponse(response);
          if (!data) return;
          navigateFromPushNotificationData(data);
        }
      );

      const last = await Notifications.getLastNotificationResponseAsync();
      if (cancelled || !last) return;
      const data = extractPushDataFromResponse(last);
      if (!data) return;
      navigateFromPushNotificationData(data);
    })();

    return () => {
      cancelled = true;
      subResponse?.remove();
    };
  }, [enabled]);
}
