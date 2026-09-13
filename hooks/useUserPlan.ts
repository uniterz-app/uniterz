import { useEffect, useState } from "react";
import { subscribeUserDocLive } from "@/lib/user/subscribeUserDocLive";
import {
  normalizeStoredPlanType,
  type StoredPlanType,
} from "@/lib/pro/planChangeDisplay";

type Plan = "free" | "pro";

function proUntilFromData(data: Record<string, unknown> | null): Date | null {
  const raw = data?.proUntil as { toDate?: () => Date } | Date | null | undefined;
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw.toDate === "function") return raw.toDate();
  return null;
}

export function useUserPlan(uid?: string) {
  const [plan, setPlan] = useState<Plan>("free");
  const [planType, setPlanType] = useState<StoredPlanType | null>(null);
  const [proUntil, setProUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPlan("free");
      setPlanType(null);
      setProUntil(null);
      setLoading(false);
      return;
    }

    return subscribeUserDocLive(uid, (data) => {
      if (!data) {
        setPlan("free");
        setPlanType(null);
        setProUntil(null);
        setLoading(false);
        return;
      }
      setPlan((data.plan as Plan | undefined) ?? "free");
      setPlanType(normalizeStoredPlanType(data.planType));
      setProUntil(proUntilFromData(data));
      setLoading(false);
    });
  }, [uid]);

  const isPro =
    plan === "pro" && (!proUntil || proUntil.getTime() > Date.now());

  return { plan, planType, isPro, loading };
}
