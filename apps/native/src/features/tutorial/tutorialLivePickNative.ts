/**
 * Web `lib/tutorial/tutorialLivePick.ts` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_LIVE_PICK_KEY,
  type TutorialLivePickPayload,
} from "../../../../../lib/tutorial/tutorialLivePick";
import type {
  TutorialGrade,
  TutorialPredictPick,
} from "../../../../../lib/tutorial/tutorialNbaMock";

export async function readTutorialLivePickNative(): Promise<TutorialLivePickPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(TUTORIAL_LIVE_PICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TutorialLivePickPayload;
    if (!parsed?.pick || !parsed?.grade) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeTutorialLivePickNative(
  pick: TutorialPredictPick,
  grade: TutorialGrade
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      TUTORIAL_LIVE_PICK_KEY,
      JSON.stringify({ pick, grade } satisfies TutorialLivePickPayload)
    );
  } catch {
    /* ignore */
  }
}

export async function clearTutorialLivePickNative(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TUTORIAL_LIVE_PICK_KEY);
  } catch {
    /* ignore */
  }
}
