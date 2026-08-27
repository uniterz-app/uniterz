import { useCallback, useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFS,
  parsePushNotificationPrefs,
  type PredictionDeadlineMinutes,
  type PushNotificationPrefKey,
  type PushNotificationPrefs,
} from "@/lib/notifications/pushNotificationPrefs";
import { USER_PRIVATE_NOTIFICATION_PREFS_DOC } from "@/lib/user/userPrivatePaths";
import { db } from "../lib/firebase";

/** Web `usePushNotificationPrefs` 相当 — private/notificationPrefs */
export function usePushNotificationPrefsNative(uid: string | null | undefined) {
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
    const ref = doc(
      db,
      "users",
      uid,
      "private",
      USER_PRIVATE_NOTIFICATION_PREFS_DOC
    );
    return onSnapshot(
      ref,
      (snap) => {
        const raw = snap.exists() ? snap.data()?.prefs : undefined;
        setPrefs(parsePushNotificationPrefs(raw));
        setLoading(false);
      },
      () => {
        setPrefs({ ...DEFAULT_PUSH_NOTIFICATION_PREFS });
        setLoading(false);
      }
    );
  }, [uid]);

  const persistPrefs = useCallback(
    async (next: PushNotificationPrefs) => {
      if (!uid) return;
      await setDoc(
        doc(
          db,
          "users",
          uid,
          "private",
          USER_PRIVATE_NOTIFICATION_PREFS_DOC
        ),
        {
          prefs: next,
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
