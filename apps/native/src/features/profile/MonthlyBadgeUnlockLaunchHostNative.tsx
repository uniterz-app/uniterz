/**
 * 起動時・復帰時に、まだ見ていない月間ランキングバッジを受け取り演出で出す（1 枚ずつ）。
 * 読むのは直近 45 日に付与された user_badges だけ。既読は端末に保存する。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguageFromAuth } from "../../i18n/useNativeUserLanguageFromAuth";
import { isTabTransitionBusy, runAfterTabTransition } from "../../navigation/tabTransitionLockNative";
import MonthlyBadgeUnlockOverlayNative from "./MonthlyBadgeUnlockOverlayNative";
import {
  parseMonthlyRankingBadgeId,
  readMonthlyBadgeRecord,
  type MonthlyBadgeRecord,
  type MonthlyBadgeRef,
} from "../../../../../lib/badges/monthlyRankingBadge";
import { UNIT_EARN_LAUNCH_DELAY_MS } from "../../../../../lib/units/unitEarnLaunchSummary";
import {
  claimLaunchPromptSlot,
  releaseLaunchPromptSlot,
  subscribeLaunchPromptSlotFree,
} from "../../../../../lib/launch/launchPromptSlot";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "../../../../../lib/tutorial/tutorialWelcomeChrome";

const SLOT_ID = "monthly-badge-unlock-launch";
const LAUNCH_DELAY_MS = UNIT_EARN_LAUNCH_DELAY_MS + 1200;
const RESUME_RECHECK_MS = 60_000;
const LOOKBACK_MS = 45 * 24 * 60 * 60 * 1000;

type Entry = { badgeId: string; ref: MonthlyBadgeRef; record: MonthlyBadgeRecord | null };

const seenKey = (uid: string) => `uniterz.monthlyBadgeSeen.v1:${uid}`;

async function readSeen(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(seenKey(uid));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

async function addSeen(uid: string, id: string): Promise<void> {
  try {
    const seen = await readSeen(uid);
    seen.add(id);
    await AsyncStorage.setItem(seenKey(uid), JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

async function loadUnseen(uid: string): Promise<Entry[]> {
  const since = Timestamp.fromMillis(Date.now() - LOOKBACK_MS);
  const snap = await getDocs(
    query(collection(db, "user_badges", uid, "badges"), where("grantedAt", ">=", since))
  );
  const seen = await readSeen(uid);
  const out: (Entry & { at: number })[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const badgeId = typeof data.badgeId === "string" ? data.badgeId : d.id;
    if (seen.has(badgeId)) return;
    const ref = parseMonthlyRankingBadgeId(badgeId);
    if (!ref) return;
    const ga = data.grantedAt;
    out.push({
      badgeId,
      ref,
      record: readMonthlyBadgeRecord(data.meta),
      at: ga instanceof Timestamp ? ga.toMillis() : 0,
    });
  });
  // 同じ月はまとめて届くので、部門 → 総合 → 他の順に見せる
  const kindOrder = { overall: 0, upset: 1, scorer: 2, winrate: 3 } as const;
  out.sort(
    (a, b) =>
      a.at - b.at ||
      a.ref.label.localeCompare(b.ref.label) ||
      (a.ref.division === b.ref.division ? 0 : a.ref.division === "pickup" ? -1 : 1) ||
      kindOrder[a.ref.kind] - kindOrder[b.ref.kind]
  );
  return out.map(({ at: _at, ...e }) => e);
}

export default function MonthlyBadgeUnlockLaunchHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const { language } = useNativeUserLanguageFromAuth();
  const [active, setActive] = useState<Entry | null>(null);
  const queueRef = useRef<Entry[]>([]);
  const shownRef = useRef(false);
  const checkingRef = useRef(false);
  const lastCheckRef = useRef(0);

  const tryShow = useCallback(() => {
    if (shownRef.current || queueRef.current.length === 0) return;
    if (getTutorialWelcomeChromeHidden()) return;
    if (isTabTransitionBusy()) {
      runAfterTabTransition(tryShow);
      return;
    }
    if (!claimLaunchPromptSlot(SLOT_ID)) return;
    shownRef.current = true;
    setActive(queueRef.current.shift() ?? null);
  }, []);

  const check = useCallback(async () => {
    if (!uid || checkingRef.current || shownRef.current) return;
    checkingRef.current = true;
    lastCheckRef.current = Date.now();
    try {
      queueRef.current = await loadUnseen(uid);
      tryShow();
    } catch {
      /* ignore */
    } finally {
      checkingRef.current = false;
    }
  }, [uid, tryShow]);

  useEffect(() => {
    if (!uid) return;
    const t = setTimeout(() => void check(), LAUNCH_DELAY_MS);
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
    if (done && uid) void addSeen(uid, done.badgeId);
    if (queueRef.current.length > 0) {
      // 閉じるフェードが終わってから次の 1 枚（枠は持ったまま）
      setTimeout(() => setActive(queueRef.current.shift() ?? null), 450);
      return;
    }
    shownRef.current = false;
    releaseLaunchPromptSlot(SLOT_ID);
  }, [active, uid]);

  if (!active) return null;

  return (
    <MonthlyBadgeUnlockOverlayNative
      key={active.badgeId}
      badgeRef={active.ref}
      record={active.record}
      language={language}
      onClose={dismiss}
    />
  );
}
