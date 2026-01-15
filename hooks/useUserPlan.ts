import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

type Plan = "free" | "pro";

export function useUserPlan(uid?: string) {
  const [plan, setPlan] = useState<Plan>("free");
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", uid);

    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setPlan("free");
        setProUntil(null);
        setLoading(false);
        return;
      }

      const d = snap.data();
      setPlan(d.plan ?? "free");
      setProUntil(d.proUntil?.toDate?.() ?? null);
      setLoading(false);
    });
  }, [uid]);

  const isPro =
    plan === "pro" && (!proUntil || proUntil.getTime() > Date.now());

  return { plan, isPro, loading };
}
