import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../hooks/useNativeUserLanguage";
import { useNativePushNotifications } from "./useNativePushNotifications";
import PushPermissionPrimerModalNative from "./PushPermissionPrimerModalNative";
import {
  markPushPermissionPrimerDismissedNative,
  readPushPermissionPrimerDismissedNative,
} from "./pushPermissionPrimerNative";
import { loadExpoNotificationsModule } from "./expoNotificationsModuleNative";
import { registerNativePushTokenFlow } from "./registerPushTokenNative";
import { subscribePushPermissionPrimerRequests } from "./requestPushPermissionPrimerNative";

/** プリマー Modal 閉鎖後に OS ダイアログ / 次 UI を重ねない */
function scheduleAfterPrimerDismissed(onReady: () => void) {
  InteractionManager.runAfterInteractions(() => {
    setTimeout(onReady, 320);
  });
}

/** メインタブ内でプッシュ通知を登録・タップ遷移を処理 */
export default function NativePushNotificationsHost() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const authed = status === "ready" && !!uid;
  const { language } = useNativeUserLanguage(uid);
  const [primerOpen, setPrimerOpen] = useState(false);
  const settledRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!authed || !uid) {
      setPrimerOpen(false);
      settledRef.current = null;
      return;
    }

    return subscribePushPermissionPrimerRequests((onSettled) => {
      void (async () => {
        const Notifications = await loadExpoNotificationsModule();
        if (!Notifications) {
          onSettled();
          return;
        }

        const perm = await Notifications.getPermissionsAsync();
        if (perm.status === "granted" || perm.status === "denied") {
          onSettled();
          return;
        }

        const dismissed = await readPushPermissionPrimerDismissedNative(uid);
        if (dismissed) {
          onSettled();
          return;
        }

        settledRef.current = onSettled;
        setPrimerOpen(true);
      })();
    });
  }, [authed, uid]);

  useNativePushNotifications(authed && !primerOpen);

  const handlePrimerLater = useCallback(() => {
    if (uid) void markPushPermissionPrimerDismissedNative(uid);
    setPrimerOpen(false);
    const settled = settledRef.current;
    settledRef.current = null;
    scheduleAfterPrimerDismissed(() => settled?.());
  }, [uid]);

  const handlePrimerAllow = useCallback(() => {
    if (uid) void markPushPermissionPrimerDismissedNative(uid);
    setPrimerOpen(false);
    const settled = settledRef.current;
    settledRef.current = null;
    scheduleAfterPrimerDismissed(() => {
      void (async () => {
        await registerNativePushTokenFlow();
        settled?.();
      })();
    });
  }, [uid]);

  return (
    <PushPermissionPrimerModalNative
      open={primerOpen}
      language={language}
      onAllow={handlePrimerAllow}
      onLater={handlePrimerLater}
    />
  );
}
