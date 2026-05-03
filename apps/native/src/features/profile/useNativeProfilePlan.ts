/**
 * Web `useProfilePlan` と同等（ログインユーザの plan / pro 期限の解決）。
 */
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

type Params = {
  targetUid: string | null | undefined;
  profilePlan?: string | null;
};

export function useNativeProfilePlan({ targetUid, profilePlan }: Params) {
  const me = auth.currentUser;
  const myUid = me?.uid ?? null;

  const isMe = !!(myUid && targetUid && myUid === targetUid);

  const [myPlan, setMyPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(isMe);

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
        if (!cancelled) setLoadingPlan(true);

        const userDocRef = doc(db, "users", myUid);
        const snap = await getDoc(userDocRef);

        if (!snap.exists()) {
          if (!cancelled) {
            setMyPlan("free");
            setLoadingPlan(false);
          }
          return;
        }

        const data = snap.data() as Record<string, unknown>;

        let nextPlan = (typeof data.plan === "string" ? data.plan : "free") as string;

        if (isMe) {
          const proUntil = data.proUntil as { toMillis?: () => number } | undefined;
          const proUntilMs =
            proUntil && typeof proUntil.toMillis === "function"
              ? proUntil.toMillis()
              : undefined;
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

    void run();

    return () => {
      cancelled = true;
    };
  }, [myUid, isMe]);

  const isMyPro = myPlan === "pro";
  const isTargetPro = (profilePlan ?? "free") === "pro";

  const effectivePlan = useMemo(() => {
    return isMe ? (myPlan ?? "free") : (profilePlan ?? "free");
  }, [isMe, myPlan, profilePlan]);

  const isProView = effectivePlan === "pro";

  return {
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
