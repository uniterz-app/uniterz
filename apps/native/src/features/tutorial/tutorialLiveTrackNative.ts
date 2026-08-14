/**
 * Web `lib/tutorial/tutorialLiveTrack.ts` 相当
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_LIVE_TRACK_KEY,
  normalizeTutorialLiveTrack,
  type TutorialLiveTrack,
} from "../../../../../lib/tutorial/tutorialLiveTrack";

export type { TutorialLiveTrack };

let track: TutorialLiveTrack | null = null;

export function getTutorialLiveTrackNative(): TutorialLiveTrack {
  return track ?? "full";
}

export function setTutorialLiveTrackNative(next: TutorialLiveTrack | null): void {
  track = next;
  void (async () => {
    try {
      if (!next) {
        await AsyncStorage.removeItem(TUTORIAL_LIVE_TRACK_KEY);
        return;
      }
      await AsyncStorage.setItem(TUTORIAL_LIVE_TRACK_KEY, next);
    } catch {
      /* ignore */
    }
  })();
}

export async function hydrateTutorialLiveTrackNative(): Promise<TutorialLiveTrack> {
  try {
    const v = await AsyncStorage.getItem(TUTORIAL_LIVE_TRACK_KEY);
    track = normalizeTutorialLiveTrack(v);
  } catch {
    track = null;
  }
  return getTutorialLiveTrackNative();
}
