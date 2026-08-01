import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFS,
  parsePushNotificationPrefs,
  type PredictionDeadlineMinutes,
  type PushNotificationPrefKey,
  type PushNotificationPrefs,
} from "@/lib/notifications/pushNotificationPrefs";
import { db } from "../lib/firebase";

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
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setPrefs(parsePushNotificationPrefs(snap.data()?.notificationPrefs));
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return unsub;
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
