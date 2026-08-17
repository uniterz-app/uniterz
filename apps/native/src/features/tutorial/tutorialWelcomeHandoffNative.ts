/**
 * Web `lib/tutorial/tutorialWelcomeHandoff.ts` 相当
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_WELCOME_HANDOFF_KEY,
  normalizeTutorialWelcomeHandoff,
  type TutorialWelcomeHandoff,
} from "../../../../../lib/tutorial/tutorialWelcomeHandoff";

export type { TutorialWelcomeHandoff };

let handoff: TutorialWelcomeHandoff | null = null;
/** set() 後はメモリが正。hydrate が未書き込み storage で上書きしない */
let memoryAuthoritative = false;

export function getTutorialWelcomeHandoffNative(): TutorialWelcomeHandoff | null {
  return handoff;
}

export function setTutorialWelcomeHandoffNative(
  next: TutorialWelcomeHandoff | null
): void {
  handoff = next;
  memoryAuthoritative = true;
  void (async () => {
    try {
      if (!next) {
        await AsyncStorage.removeItem(TUTORIAL_WELCOME_HANDOFF_KEY);
        return;
      }
      await AsyncStorage.setItem(TUTORIAL_WELCOME_HANDOFF_KEY, next);
    } catch {
      /* ignore */
    }
  })();
}

export async function hydrateTutorialWelcomeHandoffNative(): Promise<TutorialWelcomeHandoff | null> {
  if (memoryAuthoritative) return handoff;
  try {
    const v = await AsyncStorage.getItem(TUTORIAL_WELCOME_HANDOFF_KEY);
    handoff = normalizeTutorialWelcomeHandoff(v);
  } catch {
    handoff = null;
  }
  memoryAuthoritative = true;
  return handoff;
}
