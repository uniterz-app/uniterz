import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

type Plan = "free" | "pro";

/** Web `useUserPlan` 相当 */
export function useNativeUserPlan(uid?: string | null) {
  const [plan, setPlan] = useState<Plan>("free");
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      setProUntil(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", uid);
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setPlan("free");
          setProUntil(null);
          setLoading(false);
          return;
        }
        const d = snap.data();
        setPlan(d.plan === "pro" ? "pro" : "free");
        setProUntil(d.proUntil?.toDate?.() ?? null);
        setLoading(false);
      },
      () => {
        setPlan("free");
        setProUntil(null);
        setLoading(false);
      }
    );
  }, [uid]);

  const isPro =
    plan === "pro" && (!proUntil || proUntil.getTime() > Date.now());

  return { plan, isPro, loading };
}
