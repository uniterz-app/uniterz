/**
 * Web `useProfilePlan` と同等（ログインユーザの plan / pro 期限の解決）。
 * ProfileHome が users を既に読んでいる場合は `myPlanOverride` で追加 getDoc を避ける。
 */
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { withTimeout } from "../../../../../lib/async/withTimeout";

type Params = {
  targetUid: string | null | undefined;
  /** 他人プロフィールの plan（または自分の表示用フォールバック） */
  profilePlan?: string | null;
  /**
   * 親が `users/{myUid}` から解決済みの plan。
   * `myPlanOverrideReady` が true のとき getDoc をスキップする。
   */
  myPlanOverride?: string | null;
  myPlanOverrideReady?: boolean;
  /**
   * 親が users を読む前提。true のあいだは自分用 getDoc を走らせない
   *（override 待ちの二重読み防止）。
   */
  deferOwnFetch?: boolean;
};

const PLAN_FETCH_TIMEOUT_MS = 12_000;

/**
 * Pro 期限切れなら表示上 free に倒す。
 *
 * Firestore は書き換えない: users の plan / proUntil / cancelAtPeriodEnd は
 * ルールでクライアント書き込み禁止（以前の setDoc は毎回 permission-denied）。
 * 実際のダウングレードは Functions の `expireProUsers` が行う。
 */
export function resolveAndExpireMyPlan(
  _myUid: string,
  data: Record<string, unknown>
): "free" | "pro" {
  const plan = typeof data.plan === "string" ? data.plan : "free";
  if (plan !== "pro") return "free";

  const proUntil = data.proUntil as { toMillis?: () => number } | undefined;
  const proUntilMs =
    proUntil && typeof proUntil.toMillis === "function"
      ? proUntil.toMillis()
      : undefined;
  const cancelAtPeriodEnd = data.cancelAtPeriodEnd === true;

  if (
    cancelAtPeriodEnd &&
    typeof proUntilMs === "number" &&
    Date.now() > proUntilMs
  ) {
    return "free";
  }
  return "pro";
}

export function useNativeProfilePlan({
  targetUid,
  profilePlan,
  myPlanOverride,
  myPlanOverrideReady = false,
  deferOwnFetch = false,
}: Params) {
  const me = auth.currentUser;
  const myUid = me?.uid ?? null;

  const isMe = !!(myUid && targetUid && myUid === targetUid);
  const useOverride = isMe && myPlanOverrideReady;
  const waitForParent = isMe && deferOwnFetch && !myPlanOverrideReady;

  const [myPlan, setMyPlan] = useState<string | null>(() =>
    useOverride ? (myPlanOverride ?? "free") : null
  );
  const [loadingPlan, setLoadingPlan] = useState(
    () => isMe && !useOverride
  );

  useEffect(() => {
    if (useOverride) {
      setMyPlan(myPlanOverride ?? "free");
      setLoadingPlan(false);
      return;
    }

    if (waitForParent) {
      setLoadingPlan(true);
      return;
    }

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
        const snap = await withTimeout(
          getDoc(userDocRef),
          PLAN_FETCH_TIMEOUT_MS,
          "plan-fetch-timeout"
        );

        if (!snap.exists()) {
          if (!cancelled) {
            setMyPlan("free");
            setLoadingPlan(false);
          }
          return;
        }

        const nextPlan = resolveAndExpireMyPlan(
          myUid,
          snap.data() as Record<string, unknown>
        );

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
  }, [myUid, isMe, useOverride, myPlanOverride, waitForParent]);

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
