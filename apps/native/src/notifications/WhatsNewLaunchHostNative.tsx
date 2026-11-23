/**
 * 起動時のお知らせ。まだ App には載せていない。開発の「通知テスト」からだけ開く。
 * 載せるときは、ほかの起動シートより先に枠を取る（約 900ms）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  WHATS_NEW_RELEASE_ID,
  whatsNewLaunchLayout,
  whatsNewLaunchNotes,
  type WhatsNewNoteAction,
} from "../../../../lib/launch/whatsNewNotes";
import { markWhatsNewLaunchDecided } from "../../../../lib/launch/whatsNewLaunchGate";
import {
  claimLaunchPromptSlot,
  releaseLaunchPromptSlot,
  subscribeLaunchPromptSlotFree,
} from "../../../../lib/launch/launchPromptSlot";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "../../../../lib/tutorial/tutorialWelcomeChrome";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserPlan } from "../hooks/useNativeUserPlan";
import { useNativeLanguage } from "../i18n/NativeLanguageProvider";
import { openProSubscribeNative } from "../navigation/navigationRef";
import NotificationProGateModalNative from "../features/profile/screens/NotificationProGateModalNative";
import WhatsNewSheetModalNative from "./WhatsNewSheetModalNative";
import { handleWhatsNewAction } from "./whatsNewNavigationNative";

const SLOT_ID = "whats-new-launch";
const SEEN_KEY = "uniterz.whatsNewLaunchSeen";
/** スプラッシュの直後、ほかの起動シート（1100ms〜）より先に出す */
const SHOW_AFTER_MS = 900;

export default function WhatsNewLaunchHostNative() {
  const { language } = useNativeLanguage();
  const { fUser } = useFirebaseUser();
  const { isPro } = useNativeUserPlan(fUser?.uid);
  const notes = useMemo(() => whatsNewLaunchNotes(), []);
  const layout = useMemo(() => whatsNewLaunchLayout(notes), [notes]);
  const [open, setOpen] = useState(false);
  const [proGateOpen, setProGateOpen] = useState(false);
  const claimedRef = useRef(false);
  const needsShowRef = useRef(false);
  const openRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = () => {
    if (!showTimerRef.current) return;
    clearTimeout(showTimerRef.current);
    showTimerRef.current = null;
  };

  const release = useCallback(() => {
    clearShowTimer();
    if (!claimedRef.current) return;
    claimedRef.current = false;
    releaseLaunchPromptSlot(SLOT_ID);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const scheduleShow = () => {
      if (!claimedRef.current || openRef.current) return;
      if (getTutorialWelcomeChromeHidden()) return;
      clearShowTimer();
      showTimerRef.current = setTimeout(() => {
        showTimerRef.current = null;
        if (!claimedRef.current || openRef.current) return;
        if (getTutorialWelcomeChromeHidden()) return;
        openRef.current = true;
        setOpen(true);
      }, SHOW_AFTER_MS);
    };

    const tryClaim = () => {
      if (!needsShowRef.current || cancelled) return;
      if (claimedRef.current) {
        scheduleShow();
        return;
      }
      if (!claimLaunchPromptSlot(SLOT_ID)) return;
      claimedRef.current = true;
      markWhatsNewLaunchDecided();
      scheduleShow();
    };

    void (async () => {
      if (notes.length === 0) {
        markWhatsNewLaunchDecided();
        return;
      }
      const seen = await AsyncStorage.getItem(SEEN_KEY).catch(() => null);
      if (cancelled) return;
      if (seen === WHATS_NEW_RELEASE_ID) {
        markWhatsNewLaunchDecided();
        return;
      }
      needsShowRef.current = true;
      tryClaim();
    })();

    const unsubSlot = subscribeLaunchPromptSlotFree(tryClaim);
    const unsubTutorial = subscribeTutorialWelcomeChromeHidden(tryClaim);

    return () => {
      cancelled = true;
      unsubSlot();
      unsubTutorial();
      clearShowTimer();
      if (claimedRef.current) {
        claimedRef.current = false;
        releaseLaunchPromptSlot(SLOT_ID);
      }
    };
  }, [notes.length]);

  const dismiss = useCallback(() => {
    needsShowRef.current = false;
    openRef.current = false;
    setOpen(false);
    void AsyncStorage.setItem(SEEN_KEY, WHATS_NEW_RELEASE_ID).catch(() => {});
    release();
  }, [release]);

  const onAction = useCallback(
    (action: WhatsNewNoteAction) => {
      dismiss();
      handleWhatsNewAction(action, {
        isPro,
        onProGate: () => setProGateOpen(true),
      });
    },
    [dismiss, isPro]
  );

  return (
    <>
      <WhatsNewSheetModalNative
        open={open && notes.length > 0}
        language={language}
        notes={notes}
        layout={layout}
        onClose={dismiss}
        onAction={onAction}
      />
      <NotificationProGateModalNative
        visible={proGateOpen}
        language={language}
        onClose={() => setProGateOpen(false)}
        onSeePro={() => {
          setProGateOpen(false);
          openProSubscribeNative();
        }}
      />
    </>
  );
}
