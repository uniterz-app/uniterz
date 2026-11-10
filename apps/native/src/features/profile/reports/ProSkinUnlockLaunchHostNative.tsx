/**
 * 起動時・復帰時に Pro Skin の条件達成をモーダルで出す。
 * Pro: 解放済みスキンを「適用」。Free: 条件達成済みスキンを見せて Pro 購入へ。
 * users の live 購読（RootNavigator と共有）でキューの有無を見て、あるときだけ API を読む。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguageFromAuth } from "../../../i18n/useNativeUserLanguageFromAuth";
import {
  isTabTransitionBusy,
  runAfterTabTransition,
} from "../../../navigation/tabTransitionLockNative";
import { openProSubscribeNative } from "../../../navigation/navigationRef";
import { trackProFunnelNative } from "../../billing/proFunnelNative";
import ProfileProSkinUnlockOverlayNative from "./ProfileProSkinUnlockOverlayNative";
import {
  dismissMeProSkinNoticesNative,
  fetchProSkinStatusNative,
} from "../accountApiNative";
import {
  filterUnseenMilestoneUnlocks,
  mergeProSkinNoticeQueues,
  parseProSkinUnlockSeenIds,
  proSkinUnlockNoticeSeenKey,
  resolveProSkinUnlockNoticeEntries,
  serializeProSkinUnlockSeenIds,
} from "../../../../../../lib/profile/proSkinUnlockNotice";
import type { ProfilePlanProBgVariant } from "../../../../../../lib/profile/profilePlanProBgVariants";
import { subscribeUserDocLive } from "../../../../../../lib/user/subscribeUserDocLive";
import { UNIT_EARN_LAUNCH_DELAY_MS } from "../../../../../../lib/units/unitEarnLaunchSummary";
import {
  claimLaunchPromptSlot,
  releaseLaunchPromptSlot,
  subscribeLaunchPromptSlotFree,
} from "../../../../../../lib/launch/launchPromptSlot";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "../../../../../../lib/tutorial/tutorialWelcomeChrome";

const SLOT_ID = "pro-skin-unlock-launch";
/** Unit 獲得カードより後に枠を取りに行く */
const LAUNCH_DELAY_MS = UNIT_EARN_LAUNCH_DELAY_MS + 600;
const RESUME_RECHECK_MS = 60_000;

type Pending = {
  ids: ProfilePlanProBgVariant[];
  /** 表示しない分（Pro なのに未解放など）も既読にしてキューから消す */
  dismissIds: string[];
  locked: boolean;
  ownerCounts: Record<string, number>;
};

async function readSeen(uid: string): Promise<Set<string>> {
  try {
    return parseProSkinUnlockSeenIds(
      await AsyncStorage.getItem(proSkinUnlockNoticeSeenKey(uid))
    );
  } catch {
    return new Set();
  }
}

async function addSeen(uid: string, ids: readonly string[]): Promise<void> {
  try {
    const seen = await readSeen(uid);
    for (const id of ids) seen.add(id);
    await AsyncStorage.setItem(
      proSkinUnlockNoticeSeenKey(uid),
      serializeProSkinUnlockSeenIds(seen)
    );
  } catch {
    /* ignore */
  }
}

function displayableIds(ids: readonly string[]): ProfilePlanProBgVariant[] {
  return resolveProSkinUnlockNoticeEntries(ids).map((e) => e.id);
}

export default function ProSkinUnlockLaunchHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const { language } = useNativeUserLanguageFromAuth();
  const [active, setActive] = useState<Pending | null>(null);
  const userDocRef = useRef<Record<string, unknown> | null | undefined>(undefined);
  const waitingRef = useRef<Pending | null>(null);
  const shownRef = useRef(false);
  const checkingRef = useRef(false);
  const launchDueRef = useRef(false);
  const lastCheckRef = useRef(0);

  const tryShow = useCallback(() => {
    const next = waitingRef.current;
    if (!next || shownRef.current) return;
    if (getTutorialWelcomeChromeHidden()) return;
    if (isTabTransitionBusy()) {
      runAfterTabTransition(tryShow);
      return;
    }
    if (!claimLaunchPromptSlot(SLOT_ID)) return;
    waitingRef.current = null;
    shownRef.current = true;
    setActive(next);
    if (next.locked) trackProFunnelNative("skin_modal_shown");
  }, []);

  const check = useCallback(async () => {
    if (!uid || checkingRef.current || shownRef.current) return;
    const data = userDocRef.current;
    if (data === undefined) {
      launchDueRef.current = true;
      return;
    }
    launchDueRef.current = false;
    lastCheckRef.current = Date.now();
    const seen = await readSeen(uid);
    if (filterUnseenMilestoneUnlocks(mergeProSkinNoticeQueues(data ?? {}), seen).length === 0) {
      return;
    }
    checkingRef.current = true;
    try {
      const status = await fetchProSkinStatusNative();
      const queued = [...new Set([...status.noticeIds, ...status.lockedNoticeIds])];
      const unseen = filterUnseenMilestoneUnlocks(queued, seen);
      if (unseen.length === 0) return;
      const unlocked = new Set(status.unlockedIds);
      const ids = displayableIds(
        status.isPro ? unseen.filter((id) => unlocked.has(id)) : unseen
      );
      if (ids.length === 0) {
        await addSeen(uid, unseen);
        void dismissMeProSkinNoticesNative(unseen).catch(() => {});
        return;
      }
      waitingRef.current = {
        ids,
        dismissIds: unseen,
        locked: !status.isPro,
        ownerCounts: status.ownerCounts,
      };
      tryShow();
    } catch {
      /* ignore */
    } finally {
      checkingRef.current = false;
    }
  }, [uid, tryShow]);

  useEffect(() => {
    if (!uid) {
      userDocRef.current = undefined;
      return;
    }
    return subscribeUserDocLive(uid, (data) => {
      userDocRef.current = (data ?? null) as Record<string, unknown> | null;
      if (launchDueRef.current) void check();
    });
  }, [uid, check]);

  useEffect(() => {
    if (!uid) return;
    const t = setTimeout(() => {
      void check();
    }, LAUNCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [uid, check]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (Date.now() - lastCheckRef.current < RESUME_RECHECK_MS) return;
      void check();
    });
    const unsubTutorial = subscribeTutorialWelcomeChromeHidden(tryShow);
    const unsubSlot = subscribeLaunchPromptSlotFree(tryShow);
    return () => {
      sub.remove();
      unsubTutorial();
      unsubSlot();
    };
  }, [check, tryShow]);

  const dismiss = useCallback(() => {
    const done = active;
    setActive(null);
    shownRef.current = false;
    releaseLaunchPromptSlot(SLOT_ID);
    if (!done || !uid) return;
    void (async () => {
      await addSeen(uid, done.dismissIds);
      await dismissMeProSkinNoticesNative(done.dismissIds).catch(() => {});
    })();
  }, [active, uid]);

  if (!active) return null;

  return (
    <ProfileProSkinUnlockOverlayNative
      unlockedIds={active.ids}
      language={language}
      visible
      locked={active.locked}
      ownerCounts={active.ownerCounts}
      onDismiss={dismiss}
      onUpgrade={() => {
        trackProFunnelNative("skin_modal_tap");
        // モーダルが閉じ切る前に次の画面を重ねると iOS で表示されない
        setTimeout(() => openProSubscribeNative("skin_modal"), 400);
      }}
    />
  );
}
