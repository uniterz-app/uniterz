/**
 * アプリ初回チュートリアル（パターンC）既読。
 * アカウント単位: Firestore users/{uid}/reads/appTutorial:v1
 * 端末キャッシュ: localStorage（uid 付き。ちらつき防止）
 */

import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const APP_TUTORIAL_READ_ID = "appTutorial:v1";

/** プレフィックス。実キーは `${APP_TUTORIAL_LS_KEY}:${uid}` */
export const APP_TUTORIAL_LS_KEY = "uniterz:appTutorialSeen:v1";

/** スライド完了後・初回予想待ち（端末のみ。再訪時はパルスだけ出す） */
export const APP_TUTORIAL_PULSE_LS_KEY = "uniterz:appTutorialPulsePending:v1";

function seenStorageKey(uid: string): string {
  return `${APP_TUTORIAL_LS_KEY}:${uid}`;
}

function pulseStorageKey(uid: string): string {
  return `${APP_TUTORIAL_PULSE_LS_KEY}:${uid}`;
}

/**
 * 旧・端末共通キーを除去。
 * （別アカウントで既読が持ち越され、新規登録後にチュートリアルが始まらない不具合対策）
 */
function clearLegacyUnscopedKeys(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(APP_TUTORIAL_LS_KEY);
    window.localStorage.removeItem(APP_TUTORIAL_PULSE_LS_KEY);
  } catch {
    /* ignore */
  }
}

export function readAppTutorialSeenLocal(uid: string): boolean {
  if (typeof window === "undefined") return true;
  clearLegacyUnscopedKeys();
  try {
    return window.localStorage.getItem(seenStorageKey(uid)) === "1";
  } catch {
    return true;
  }
}

/** 端末の既読フラグだけ消す（プレビュー用） */
export function clearAppTutorialSeenLocal(uid?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (uid) window.localStorage.removeItem(seenStorageKey(uid));
    clearLegacyUnscopedKeys();
    if (uid) window.localStorage.removeItem(pulseStorageKey(uid));
  } catch {
    /* ignore */
  }
}

export function markAppTutorialSeenLocal(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    clearLegacyUnscopedKeys();
    window.localStorage.setItem(seenStorageKey(uid), "1");
    window.localStorage.removeItem(pulseStorageKey(uid));
  } catch {
    /* ignore */
  }
}

export function readAppTutorialPulsePendingLocal(uid: string): boolean {
  if (typeof window === "undefined") return false;
  clearLegacyUnscopedKeys();
  try {
    return window.localStorage.getItem(pulseStorageKey(uid)) === "1";
  } catch {
    return false;
  }
}

export function markAppTutorialPulsePendingLocal(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    clearLegacyUnscopedKeys();
    window.localStorage.setItem(pulseStorageKey(uid), "1");
  } catch {
    /* ignore */
  }
}

export function clearAppTutorialPulsePendingLocal(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(pulseStorageKey(uid));
    clearLegacyUnscopedKeys();
  } catch {
    /* ignore */
  }
}

/** Firestore から既読確認。失敗時は local を返す */
export async function fetchAppTutorialSeen(uid: string): Promise<boolean> {
  if (readAppTutorialSeenLocal(uid)) return true;
  try {
    const snap = await getDoc(
      doc(db, `users/${uid}/reads`, APP_TUTORIAL_READ_ID)
    );
    if (snap.exists()) {
      markAppTutorialSeenLocal(uid);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** 既読書き込み（firestore + local）。uid なしは何もしない */
export async function markAppTutorialSeen(
  uid: string | null | undefined
): Promise<void> {
  if (!uid) return;
  markAppTutorialSeenLocal(uid);
  try {
    await setDoc(
      doc(db, `users/${uid}/reads`, APP_TUTORIAL_READ_ID),
      { at: serverTimestamp() },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
}

/**
 * 既読を完全リセット（local + Firestore）。
 * プレビューから本番ツアーをやり直すときに使う。
 */
export async function clearAppTutorialSeen(
  uid: string | null | undefined
): Promise<void> {
  clearAppTutorialSeenLocal(uid);
  if (!uid) return;
  try {
    await deleteDoc(doc(db, `users/${uid}/reads`, APP_TUTORIAL_READ_ID));
  } catch {
    /* 未作成・権限なしは無視 */
  }
}
