/**
 * 起動時、調子がいいタイミングで OS 標準のストアレビュー依頼を 1 回出す。
 * 同じ起動でほかの起動時モーダルが出ていたら出さない。結果の読み取りは 1 日 1 回まで。
 */
import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { db } from "../../lib/firebase";
import { isTabTransitionBusy } from "../../navigation/tabTransitionLockNative";
import { trackProFunnelNative } from "../billing/proFunnelNative";
import {
  readStoreReviewLastRequestedAtNative,
  requestStoreReviewNative,
} from "./storeReviewPromptNative";
import {
  isStoreReviewBaseEligible,
  isStoreReviewGoodMoment,
  readStoreReviewProgress,
  STORE_REVIEW_RECENT_WINDOW_MS,
} from "../../../../../lib/app/storeReviewMoment";
import { proFunnelDayKey } from "../../../../../lib/billing/proFunnelEvents";
import { subscribeUserDocLive } from "../../../../../lib/user/subscribeUserDocLive";
import { UNIT_EARN_LAUNCH_DELAY_MS } from "../../../../../lib/units/unitEarnLaunchSummary";
import {
  claimLaunchPromptSlot,
  hasOtherLaunchPromptShown,
  isLaunchPromptSlotFree,
  releaseLaunchPromptSlot,
} from "../../../../../lib/launch/launchPromptSlot";
import { getTutorialWelcomeChromeHidden } from "../../../../../lib/tutorial/tutorialWelcomeChrome";

const SLOT_ID = "store-review-launch";
/** ほかの起動時モーダル（Unit 獲得・スキン解放など）が枠を取り終えてから見る */
const LAUNCH_DELAY_MS = UNIT_EARN_LAUNCH_DELAY_MS + 4000;
const RELEASE_SLOT_MS = 1500;
const RECENT_FETCH_LIMIT = 20;
const CHECKED_DAY_PREFIX = "uniterz.storeReview.checkedDay.v1";

async function loadRecentResults(uid: string, nowMs: number): Promise<boolean[]> {
  const q = query(
    collection(db, "posts"),
    where("authorUid", "==", uid),
    where("schemaVersion", "==", 2),
    where("settledAt", ">=", Timestamp.fromMillis(nowMs - STORE_REVIEW_RECENT_WINDOW_MS)),
    orderBy("settledAt", "desc"),
    limit(RECENT_FETCH_LIMIT)
  );
  const snap = await getDocs(q);
  const out: boolean[] = [];
  for (const d of snap.docs) {
    const isWin = (d.get("stats") as { isWin?: unknown } | undefined)?.isWin;
    if (typeof isWin === "boolean") out.push(isWin);
  }
  return out;
}

export default function StoreReviewLaunchHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const userDocRef = useRef<Record<string, unknown> | null | undefined>(undefined);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!uid) return;
    return subscribeUserDocLive(uid, (data) => {
      userDocRef.current = (data ?? null) as Record<string, unknown> | null;
    });
  }, [uid]);

  useEffect(() => {
    if (!uid || !fUser) return;
    const t = setTimeout(() => {
      void (async () => {
        if (doneRef.current) return;
        doneRef.current = true;
        try {
          if (hasOtherLaunchPromptShown(SLOT_ID) || !isLaunchPromptSlotFree()) return;
          if (getTutorialWelcomeChromeHidden() || isTabTransitionBusy()) return;
          const nowMs = Date.now();
          const created = Date.parse(fUser.metadata.creationTime ?? "");
          const { seasonPosts, winStreak } = readStoreReviewProgress(userDocRef.current);
          const eligible = isStoreReviewBaseEligible({
            nowMs,
            accountCreatedAtMs: Number.isFinite(created) ? created : null,
            seasonPosts,
            lastRequestedAtMs: await readStoreReviewLastRequestedAtNative(),
          });
          if (!eligible) return;

          const dayKey = `${CHECKED_DAY_PREFIX}.${uid}`;
          const today = proFunnelDayKey(nowMs);
          if ((await AsyncStorage.getItem(dayKey)) === today) return;
          await AsyncStorage.setItem(dayKey, today);

          const recentResults = winStreak >= 3 ? [] : await loadRecentResults(uid, nowMs);
          if (!isStoreReviewGoodMoment({ winStreak, recentResults })) return;

          if (!isLaunchPromptSlotFree() || !claimLaunchPromptSlot(SLOT_ID)) return;
          const requested = await requestStoreReviewNative();
          setTimeout(() => releaseLaunchPromptSlot(SLOT_ID), RELEASE_SLOT_MS);
          if (requested) trackProFunnelNative("review_prompt");
        } catch {
          /* ignore */
        }
      })();
    }, LAUNCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [uid, fUser]);

  return null;
}
