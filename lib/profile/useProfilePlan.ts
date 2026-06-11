// app/lib/profile/useProfilePlan.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type Params = {
  targetUid: string | null;
  profilePlan?: string | null;
};

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

      try {
        if (!cancelled && !(isMe && profilePlan)) setLoadingPlan(true);

        const userDocRef = doc(db, "users", myUid);
        const snap = await getDoc(userDocRef);

        if (!snap.exists()) {
          if (!cancelled) {
            setMyPlan("free");
            setLoadingPlan(false);
          }
          return;
        }

        const data = snap.data() as any;

        let nextPlan = data.plan ?? "free";

        if (isMe) {
          const proUntilMs = data.proUntil?.toMillis?.();
          const cancelAtPeriodEnd = data.cancelAtPeriodEnd === true;

          if (
            nextPlan === "pro" &&
            cancelAtPeriodEnd &&
            typeof proUntilMs === "number" &&
            Date.now() > proUntilMs
          ) {
            await setDoc(
              userDocRef,
              {
                plan: "free",
                proUntil: null,
                cancelAtPeriodEnd: false,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );

            nextPlan = "free";
          }
        }

        if (!cancelled) {
          setMyPlan(nextPlan);
          setLoadingPlan(false);
        }
      } catch {
        if (!cancelled) {
          setMyPlan("free");
          setLoadingPlan(false);
        }
      }
    }

    run();

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