import { useCallback, useEffect, useState } from "react";
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

/** メインタブ内でプッシュ通知を登録・タップ遷移を処理 */
export default function NativePushNotificationsHost() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const authed = status === "ready" && !!uid;
  const { language } = useNativeUserLanguage(uid);
  const [primerOpen, setPrimerOpen] = useState(false);
  const [primerResolved, setPrimerResolved] = useState(false);

  useEffect(() => {
    if (!authed || !uid) {
      setPrimerOpen(false);
      setPrimerResolved(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const Notifications = await loadExpoNotificationsModule();
      if (!Notifications || cancelled) {
        if (!cancelled) setPrimerResolved(true);
        return;
      }

      const perm = await Notifications.getPermissionsAsync();
      if (cancelled) return;

      if (perm.status === "granted" || perm.status === "denied") {
        setPrimerOpen(false);
        setPrimerResolved(true);
        return;
      }

      const dismissed = await readPushPermissionPrimerDismissedNative(uid);
      if (cancelled) return;

      if (dismissed) {
        setPrimerOpen(false);
      } else {
        setPrimerOpen(true);
      }
      setPrimerResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authed, uid]);

  const pushEnabled = authed && primerResolved && !primerOpen;
  useNativePushNotifications(pushEnabled);

  const handlePrimerLater = useCallback(() => {
    if (uid) void markPushPermissionPrimerDismissedNative(uid);
    setPrimerOpen(false);
  }, [uid]);

  const handlePrimerAllow = useCallback(() => {
    if (uid) void markPushPermissionPrimerDismissedNative(uid);
    setPrimerOpen(false);
    void registerNativePushTokenFlow();
  }, [uid]);

  return (
    <PushPermissionPrimerModalNative
      open={primerOpen}
      language={language === "en" ? "en" : "ja"}
      onAllow={handlePrimerAllow}
      onLater={handlePrimerLater}
    />
  );
}
