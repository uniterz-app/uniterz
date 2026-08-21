import { useCallback, useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFS,
  parsePushNotificationPrefs,
  type PredictionDeadlineMinutes,
  type PushNotificationPrefKey,
  type PushNotificationPrefs,
} from "@/lib/notifications/pushNotificationPrefs";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";
import { db } from "@/lib/firebase";

/** Native `usePushNotificationPrefsNative` 相当 — users/{uid}.notificationPrefs */
export function usePushNotificationPrefs(uid: string | null | undefined) {
  const [prefs, setPrefs] = useState<PushNotificationPrefs>({
    ...DEFAULT_PUSH_NOTIFICATION_PREFS,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPrefs({ ...DEFAULT_PUSH_NOTIFICATION_PREFS });
      setLoading(false);
      return;
    }

    setLoading(true);
    return subscribeUserDocLive(uid, (data) => {
      setPrefs(parsePushNotificationPrefs(data?.notificationPrefs));
      setLoading(false);
    });
  }, [uid]);

  const persistPrefs = useCallback(
    async (next: PushNotificationPrefs) => {
      if (!uid) return;
      await setDoc(
        doc(db, "users", uid),
        {
          notificationPrefs: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [uid]
  );

  const updatePref = useCallback(
    async (key: PushNotificationPrefKey, value: boolean) => {
      if (!uid) return;
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        void persistPrefs(next);
        return next;
      });
    },
    [uid, persistPrefs]
  );

  const updateDeadlineMinutes = useCallback(
    async (minutes: PredictionDeadlineMinutes) => {
      if (!uid) return;
      setPrefs((prev) => {
        const next = { ...prev, predictionDeadlineMinutes: minutes };
        void persistPrefs(next);
        return next;
      });
    },
    [uid, persistPrefs]
  );

  return { prefs, loading, updatePref, updateDeadlineMinutes };
}
