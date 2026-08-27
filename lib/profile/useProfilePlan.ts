// app/lib/profile/useProfilePlan.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc } from "firebase/firestore";
import { withTimeout } from "@/lib/async/withTimeout";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

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
  const [loadingPlan, setLoadingPlan] = useState(isMe && !profilePlan);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!myUid) {
        if (!cancelled) {
          setMyPlan("free");
          setLoadingPlan(false);
        }
        return;
      }

      if (isMe && profilePlan) {
        if (!cancelled) {
          setMyPlan(profilePlan);
          setLoadingPlan(false);
        }
        return;
      }

      try {
        if (!cancelled) setLoadingPlan(true);

        const userDocRef = doc(db, "users", myUid);
        const data = await withTimeout(
          getUserDocDataCached(myUid),
          PLAN_FETCH_TIMEOUT_MS,
          "plan-fetch-timeout"
        );

        if (!data) {
          if (!cancelled) {
            setMyPlan("free");
            setLoadingPlan(false);
          }
          return;
        }

        let nextPlan: "free" | "pro" = data.plan === "pro" ? "pro" : "free";

        if (isMe) {
          const proUntilRaw = data.proUntil;
          const proUntilMs =
            proUntilRaw &&
            typeof proUntilRaw === "object" &&
            "toMillis" in proUntilRaw &&
            typeof (proUntilRaw as { toMillis?: unknown }).toMillis ===
              "function"
              ? (proUntilRaw as { toMillis: () => number }).toMillis()
              : undefined;
          const cancelAtPeriodEnd = data.cancelAtPeriodEnd === true;

          // 表示だけ free に倒す。Firestore の書き換えはしない
          // （users の plan / proUntil はルールでクライアント書き込み禁止。
          //  実際のダウングレードは Functions の expireProUsers が行う）
          if (
            nextPlan === "pro" &&
            cancelAtPeriodEnd &&
            typeof proUntilMs === "number" &&
            Date.now() > proUntilMs
          ) {
            nextPlan = "free";
          }
        }

        if (!cancelled) {
          setMyPlan(nextPlan);
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
    loadingPlan,
    isMe,
    isMyPro,
    isTargetPro,
    effectivePlan,
    isProView,
  };
}
