// app/lib/profile/useProfilePlan.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { withTimeout } from "@/lib/async/withTimeout";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import {
  normalizeStoredPlanType,
  type StoredPlanType,
} from "@/lib/pro/planChangeDisplay";
import { userDataPlan } from "@/lib/pro/userPlanActive";

type Params = {
  targetUid: string | null;
  profilePlan?: string | null;
};

const PLAN_FETCH_TIMEOUT_MS = 12_000;

export function useProfilePlan({ targetUid, profilePlan }: Params) {
  const me = auth.currentUser;
  const myUid = me?.uid ?? null;

  const isMe = !!(myUid && targetUid && myUid === targetUid);

  const [myPlan, setMyPlan] = useState<string | null>(() =>
    isMe && profilePlan ? profilePlan : null
  );
  const [myPlanType, setMyPlanType] = useState<StoredPlanType | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(isMe && !profilePlan);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!myUid) {
        if (!cancelled) {
          setMyPlan("free");
          setMyPlanType(null);
          setLoadingPlan(false);
        }
        return;
      }

      try {
        if (!cancelled) setLoadingPlan(true);

        const data = await withTimeout(
          getUserDocDataCached(myUid),
          PLAN_FETCH_TIMEOUT_MS,
          "plan-fetch-timeout"
        );

        if (!data) {
          if (!cancelled) {
            setMyPlan(isMe && profilePlan ? profilePlan : "free");
            setMyPlanType(null);
            setLoadingPlan(false);
          }
          return;
        }

        // proUntil 超過は表示だけ free（plan の書き戻しは Functions expireProUsers）
        const nextPlan = userDataPlan(data as Record<string, unknown>);
        const nextType = normalizeStoredPlanType(data.planType);

        if (!cancelled) {
          setMyPlan(nextPlan);
          setMyPlanType(nextType);
          setLoadingPlan(false);
        }
      } catch {
        if (!cancelled) {
          setMyPlan((prev) => prev ?? "free");
          setLoadingPlan(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [myUid, isMe, profilePlan]);

  const isMyPro = myPlan === "pro";
  const isTargetPro = (profilePlan ?? "free") === "pro";

  const effectivePlan = useMemo(() => {
    return isMe ? (myPlan ?? "free") : (profilePlan ?? "free");
  }, [isMe, myPlan, profilePlan]);

  const isProView = effectivePlan === "pro";

  return {
    me,
    myUid,
    myPlan,
    myPlanType,
    loadingPlan,
    isMe,
    isMyPro,
    isTargetPro,
    effectivePlan,
    isProView,
  };
}
