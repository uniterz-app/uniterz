"use client";

/** users/{uid}/private/displayPrefs — 試合カードのスコア表示設定（ページ内で購読 1 本を共有） */
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  DEFAULT_MATCH_SCORE_DISPLAY_PREFS,
  parseMatchScoreDisplayPrefs,
  type MatchScoreDisplayPrefKey,
  type MatchScoreDisplayPrefs,
} from "@/lib/games/matchScoreDisplayPrefs";
import { USER_PRIVATE_DISPLAY_PREFS_DOC } from "@/lib/user/userPrivatePaths";
import { db } from "@/lib/firebase";

let currentPrefs: MatchScoreDisplayPrefs = { ...DEFAULT_MATCH_SCORE_DISPLAY_PREFS };
let currentUid: string | null = null;
let unsubscribe: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function ensureSubscribed(uid: string | null) {
  if (uid === currentUid) return;
  unsubscribe?.();
  unsubscribe = null;
  currentUid = uid;
  currentPrefs = { ...DEFAULT_MATCH_SCORE_DISPLAY_PREFS };
  emit();
  if (!uid) return;
  unsubscribe = onSnapshot(
    doc(db, "users", uid, "private", USER_PRIVATE_DISPLAY_PREFS_DOC),
    (snap) => {
      currentPrefs = parseMatchScoreDisplayPrefs(
        snap.exists() ? snap.data()?.prefs : undefined
      );
      emit();
    },
    () => {
      /* 読めないときは既定値のまま */
    }
  );
}

function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentPrefs;
}

function getServerSnapshot() {
  return DEFAULT_MATCH_SCORE_DISPLAY_PREFS;
}

export function useMatchScoreDisplayPrefs(uid: string | null | undefined) {
  useEffect(() => {
    ensureSubscribed(uid ?? null);
  }, [uid]);

  const prefs = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  const updatePref = useCallback(
    async (key: MatchScoreDisplayPrefKey, value: boolean) => {
      if (!uid) return;
      currentPrefs = { ...currentPrefs, [key]: value };
      emit();
      await setDoc(
        doc(db, "users", uid, "private", USER_PRIVATE_DISPLAY_PREFS_DOC),
        { prefs: currentPrefs, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    [uid]
  );

  return { prefs, updatePref };
}
