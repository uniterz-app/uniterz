"use client";

/**
 * 起動時・タブ復帰時に未表示の Unit 獲得をまとめて 1 枚で出す。
 * 開幕前はプレシーズン参加ボーナスの自動付与を先に依頼してから読む。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import UnitEarnLaunchCard from "@/app/component/units/UnitEarnLaunchCard";
import {
  claimMePendingUnitEarns,
  fetchMePendingUnitEarns,
} from "@/lib/api/fetchMePendingUnitEarns";
import {
  requestPreseasonBonus,
  shouldRequestPreseasonBonus,
} from "@/lib/units/preseasonBonusClient";
import {
  buildUnitEarnLaunchSummary,
  UNIT_EARN_LAUNCH_DELAY_MS,
} from "@/lib/units/unitEarnLaunchSummary";
import type { PendingUnitEarnDoc } from "@/lib/units/pendingUnitEarnTypes";
import {
  claimLaunchPromptSlot,
  releaseLaunchPromptSlot,
  subscribeLaunchPromptSlotFree,
} from "@/lib/launch/launchPromptSlot";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "@/lib/tutorial/tutorialWelcomeChrome";

const SLOT_ID = "unit-earn-launch";
/** タブ復帰で読み直す最短間隔 */
const RESUME_RECHECK_MS = 60_000;

export default function UnitEarnLaunchHost() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const { language } = useUserLanguage(uid || null);
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
      if (shouldRequestPreseasonBonus(fUser.uid)) {
        const token = await fUser.getIdToken().catch(() => null);
        if (token) await requestPreseasonBonus("", fUser.uid, token);
      }
      const res = await fetchMePendingUnitEarns();
      if (!res.ok) return;
      const fresh = res.entries.filter(
        (doc) => !handledIdsRef.current.has(doc.id)
      );
      if (!buildUnitEarnLaunchSummary(fresh, null)) {
        // 金額 0 の残骸だけなら黙って消化
        if (fresh.length > 0) {
          void claimMePendingUnitEarns(fresh.map((doc) => doc.id));
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
    const t = window.setTimeout(() => {
      void check();
    }, UNIT_EARN_LAUNCH_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [uid, check]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckRef.current < RESUME_RECHECK_MS) return;
      void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    const unsubTutorial = subscribeTutorialWelcomeChromeHidden(tryShow);
    const unsubSlot = subscribeLaunchPromptSlotFree(tryShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
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
    void claimMePendingUnitEarns(ids).catch(() => {});
  }, [docs]);

  return (
    <UnitEarnLaunchCard summary={summary} language={language} onClaim={onClaim} />
  );
}
