/**
 * Web `lib/tutorial/tutorialSeen.ts` 相当（AsyncStorage + Firestore）
 * 既読キャッシュは uid 付きキー（アカウントまたぎ防止）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  APP_TUTORIAL_LS_KEY,
  APP_TUTORIAL_PULSE_LS_KEY,
  APP_TUTORIAL_READ_ID,
} from "../../../../../lib/tutorial/tutorialSeen";

function seenStorageKey(uid: string): string {
  return `${APP_TUTORIAL_LS_KEY}:${uid}`;
}

function pulseStorageKey(uid: string): string {
  return `${APP_TUTORIAL_PULSE_LS_KEY}:${uid}`;
}

/** 旧・端末共通キーを除去 */
async function clearLegacyUnscopedKeys(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      APP_TUTORIAL_LS_KEY,
      APP_TUTORIAL_PULSE_LS_KEY,
    ]);
  } catch {
    /* ignore */
  }
}

export async function readAppTutorialSeenNative(uid: string): Promise<boolean> {
  await clearLegacyUnscopedKeys();
  try {
    return (await AsyncStorage.getItem(seenStorageKey(uid))) === "1";
  } catch {
    return true;
  }
}

export async function markAppTutorialSeenLocalNative(
  uid: string
): Promise<void> {
  try {
    await clearLegacyUnscopedKeys();
    await AsyncStorage.setItem(seenStorageKey(uid), "1");
    await AsyncStorage.removeItem(pulseStorageKey(uid));
  } catch {
    /* ignore */
  }
}

export async function readAppTutorialPulsePendingNative(
  uid: string
): Promise<boolean> {
  await clearLegacyUnscopedKeys();
  try {
    return (await AsyncStorage.getItem(pulseStorageKey(uid))) === "1";
  } catch {
    return false;
  }
}

export async function markAppTutorialPulsePendingNative(
  uid: string
): Promise<void> {
  try {
    await clearLegacyUnscopedKeys();
    await AsyncStorage.setItem(pulseStorageKey(uid), "1");
  } catch {
    /* ignore */
  }
}

export async function clearAppTutorialPulsePendingNative(
  uid: string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(pulseStorageKey(uid));
    await clearLegacyUnscopedKeys();
  } catch {
    /* ignore */
  }
}

export async function fetchAppTutorialSeenNative(
  uid: string
): Promise<boolean> {
  if (await readAppTutorialSeenNative(uid)) return true;
  try {
    const snap = await getDoc(
      doc(db, `users/${uid}/reads`, APP_TUTORIAL_READ_ID)
    );
    if (snap.exists()) {
      await markAppTutorialSeenLocalNative(uid);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function markAppTutorialSeenNative(
  uid: string | null | undefined
): Promise<void> {
  if (!uid) return;
  await markAppTutorialSeenLocalNative(uid);
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
