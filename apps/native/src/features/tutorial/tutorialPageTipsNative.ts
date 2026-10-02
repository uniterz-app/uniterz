/**
 * Web `lib/tutorial/tutorialPageTips.ts` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_PAGE_TIP_IDS,
  type TutorialPageTipId,
} from "../../../../../lib/tutorial/tutorialPageTips";

export type { TutorialPageTipId };

const LS_PREFIX = "uniterz:tutorialPageTip:v1";
const PROFILE_TIP_PREFIX = "uniterz:tutorialPageTip:v2";

function tipKey(uid: string, tip: TutorialPageTipId): string {
  const prefix = tip === "profile" ? PROFILE_TIP_PREFIX : LS_PREFIX;
  return `${prefix}:${uid}:${tip}`;
}

export async function readTutorialPageTipSeenNative(
  uid: string,
  tip: TutorialPageTipId
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(tipKey(uid, tip))) === "1";
  } catch {
    return true;
  }
}

export async function markTutorialPageTipSeenNative(
  uid: string | null | undefined,
  tip: TutorialPageTipId
): Promise<void> {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(tipKey(uid, tip), "1");
  } catch {
    /* ignore */
  }
}

export async function clearTutorialPageTipsSeenNative(
  uid?: string | null
): Promise<void> {
  try {
    if (uid) {
      await AsyncStorage.multiRemove(
        TUTORIAL_PAGE_TIP_IDS.map((tip) => tipKey(uid, tip))
      );
      return;
    }
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter(
      (k) =>
        k.startsWith(`${LS_PREFIX}:`) || k.startsWith(`${PROFILE_TIP_PREFIX}:`)
    );
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch {
    /* ignore */
  }
}

export async function markAllTutorialPageTipsSeenNative(
  uid: string | null | undefined
): Promise<void> {
  if (!uid) return;
  await Promise.all(
    TUTORIAL_PAGE_TIP_IDS.map((tip) => markTutorialPageTipSeenNative(uid, tip))
  );
}
