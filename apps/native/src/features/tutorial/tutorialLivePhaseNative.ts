/**
 * Web `lib/tutorial/tutorialLivePhase.ts` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_LIVE_PHASE_KEY,
  type TutorialLivePhase,
} from "../../../../../lib/tutorial/tutorialLivePhase";

export type { TutorialLivePhase };

export async function readTutorialLivePhaseNative(): Promise<TutorialLivePhase | null> {
  try {
    const v = await AsyncStorage.getItem(TUTORIAL_LIVE_PHASE_KEY);
    return (v as TutorialLivePhase) || null;
  } catch {
    return null;
  }
}

export async function writeTutorialLivePhaseNative(
  phase: TutorialLivePhase | null
): Promise<void> {
  try {
    if (!phase || phase === "done") {
      await AsyncStorage.removeItem(TUTORIAL_LIVE_PHASE_KEY);
      return;
    }
    await AsyncStorage.setItem(TUTORIAL_LIVE_PHASE_KEY, phase);
  } catch {
    /* ignore */
  }
}
