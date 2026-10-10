/**
 * Web `UnitEarnLaunchHost` 相当 — 起動時・復帰時に未表示の Unit 獲得をまとめて 1 枚で出す。
 * 開幕前はプレシーズン参加ボーナスの自動付与を先に依頼してから読む。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguageFromAuth } from "../../i18n/useNativeUserLanguageFromAuth";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import {
  claimMePendingUnitEarnsNative,
  fetchMePendingUnitEarnsNative,
} from "../profile/pendingUnitEarnApiNative";
import {
  isTabTransitionBusy,
  runAfterTabTransition,
} from "../../navigation/tabTransitionLockNative";
import UnitEarnLaunchCardNative from "./UnitEarnLaunchCardNative";
import {
  requestPreseasonBonus,
  shouldRequestPreseasonBonus,
} from "../../../../../lib/units/preseasonBonusClient";
import {
  buildUnitEarnLaunchSummary,
  UNIT_EARN_LAUNCH_DELAY_MS,
} from "../../../../../lib/units/unitEarnLaunchSummary";
import type { PendingUnitEarnDoc } from "../../../../../lib/units/pendingUnitEarnTypes";
import {
  claimLaunchPromptSlot,
  releaseLaunchPromptSlot,
  subscribeLaunchPromptSlotFree,
} from "../../../../../lib/launch/launchPromptSlot";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "../../../../../lib/tutorial/tutorialWelcomeChrome";

const SLOT_ID = "unit-earn-launch";
/** バックグラウンド復帰で読み直す最短間隔 */
const RESUME_RECHECK_MS = 60_000;

export default function UnitEarnLaunchHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const { language } = useNativeUserLanguageFromAuth();
  const [docs, setDocs] = useState<PendingUnitEarnDoc[] | null>(null);
  const waitingRef = useRef<PendingUnitEarnDoc[] | null>(null);
  const shownRef = useRef(false);
  const handledIdsRef = useRef(new Set<string>());
  const checkingRef = useRef(false);
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
    setDocs(next);
  }, []);

  const check = useCallback(async () => {
    if (!fUser || checkingRef.current || shownRef.current) return;
    checkingRef.current = true;
    lastCheckRef.current = Date.now();
    try {
      const base = getUniterzApiBaseUrl();
      if (base && shouldRequestPreseasonBonus(fUser.uid)) {
        const token = await fUser.getIdToken().catch(() => null);
        if (token) await requestPreseasonBonus(base, fUser.uid, token);
      }
      const res = await fetchMePendingUnitEarnsNative();
      if (!res.ok) return;
      const fresh = res.entries.filter(
        (doc) => !handledIdsRef.current.has(doc.id)
      );
      if (!buildUnitEarnLaunchSummary(fresh, null)) {
        // 金額 0 の残骸だけなら黙って消化
        if (fresh.length > 0) {
          void claimMePendingUnitEarnsNative(fresh.map((doc) => doc.id));
        }
        return;
      }
      waitingRef.current = fresh;
      tryShow();
    } catch {
      /* ignore */
    } finally {
      checkingRef.current = false;
    }
  }, [fUser, tryShow]);

  useEffect(() => {
    if (!uid) return;
    const t = setTimeout(() => {
      void check();
    }, UNIT_EARN_LAUNCH_DELAY_MS);
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

  const summary = useMemo(
    () => (docs ? buildUnitEarnLaunchSummary(docs, language) : null),
    [docs, language]
  );

  const onClaim = useCallback(() => {
    const ids = docs?.map((doc) => doc.id) ?? [];
    setDocs(null);
    shownRef.current = false;
    releaseLaunchPromptSlot(SLOT_ID);
    if (ids.length === 0) return;
    for (const id of ids) handledIdsRef.current.add(id);
    void claimMePendingUnitEarnsNative(ids).catch(() => {});
  }, [docs]);

  return (
    <UnitEarnLaunchCardNative
      summary={summary}
      language={language}
      onClaim={onClaim}
    />
  );
}
