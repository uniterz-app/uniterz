import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  DEFAULT_PUSH_NOTIFICATION_PREFS,
  parsePushNotificationPrefs,
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

  const updatePref = useCallback(
    async (key: PushNotificationPrefKey, value: boolean) => {
      if (!uid) return;
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        void setDoc(
          doc(db, "users", uid),
          {
            notificationPrefs: next,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return next;
      });
    },
    [uid]
  );

  return { prefs, loading, updatePref };
}
