import { useEffect } from "react";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserPlan } from "../hooks/useNativeUserPlan";
import { setAnalyticsUserNative } from "./appAnalyticsNative";

/** GA4 に送る User-ID と `plan`（free / pro）を最新に保つ */
export default function AppAnalyticsUserHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { isPro, loading } = useNativeUserPlan(uid);

  useEffect(() => {
    setAnalyticsUserNative(uid, uid && !loading ? (isPro ? "pro" : "free") : null);
  }, [uid, isPro, loading]);

  useEffect(() => () => setAnalyticsUserNative(null, null), []);

  return null;
}
