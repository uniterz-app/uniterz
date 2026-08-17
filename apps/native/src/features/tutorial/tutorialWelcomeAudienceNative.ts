/**
 * Web `lib/tutorial/tutorialWelcomeAudience.ts` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_WELCOME_AUDIENCE_KEY,
  normalizeTutorialWelcomeAudience,
  type TutorialWelcomeAudience,
} from "../../../../../lib/tutorial/tutorialWelcomeAudience";

export type { TutorialWelcomeAudience };

let cached: TutorialWelcomeAudience | null | undefined;

export function getTutorialWelcomeAudienceNativeMemory(): TutorialWelcomeAudience {
  return cached ?? "first";
}

export function setTutorialWelcomeAudienceNative(
  next: TutorialWelcomeAudience | null
): void {
  cached = next;
  void (async () => {
    try {
      if (!next) {
        await AsyncStorage.removeItem(TUTORIAL_WELCOME_AUDIENCE_KEY);
        return;
      }
      await AsyncStorage.setItem(TUTORIAL_WELCOME_AUDIENCE_KEY, next);
    } catch {
      /* ignore */
    }
  })();
}

export function markTutorialWelcomeReturningNative(): void {
  setTutorialWelcomeAudienceNative("returning");
}

export async function hydrateTutorialWelcomeAudienceNative(): Promise<TutorialWelcomeAudience> {
  try {
    const v = await AsyncStorage.getItem(TUTORIAL_WELCOME_AUDIENCE_KEY);
    cached = normalizeTutorialWelcomeAudience(v);
  } catch {
    cached = null;
  }
  return getTutorialWelcomeAudienceNativeMemory();
}

export async function ensureTutorialWelcomeFirstNative(): Promise<TutorialWelcomeAudience> {
  await hydrateTutorialWelcomeAudienceNative();
  if (cached === "returning") return "returning";
  setTutorialWelcomeAudienceNative("first");
  return "first";
}
