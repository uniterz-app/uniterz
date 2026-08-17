/**
 * Web `lib/tutorial/tutorialLivePhase.ts` 相当（AsyncStorage）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TUTORIAL_LIVE_PHASE_KEY,
  normalizeTutorialLivePhase,
  type TutorialLivePhase,
} from "../../../../../lib/tutorial/tutorialLivePhase";

export type { TutorialLivePhase };

type PhaseListener = (phase: TutorialLivePhase | null) => void;

const listeners = new Set<PhaseListener>();

/** write / read 済みの最新値。Games 初回描画で試合面を出さないために使う */
let cachedPhase: TutorialLivePhase | null = null;

export function getTutorialLivePhaseNativeMemory(): TutorialLivePhase | null {
  return cachedPhase;
}

export function subscribeTutorialLivePhaseNative(
  fn: PhaseListener
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notifyPhase(phase: TutorialLivePhase | null): void {
  listeners.forEach((fn) => {
    try {
      fn(phase);
    } catch {
      /* ignore */
    }
  });
}

export async function readTutorialLivePhaseNative(): Promise<TutorialLivePhase | null> {
  try {
    const v = await AsyncStorage.getItem(TUTORIAL_LIVE_PHASE_KEY);
    const phase = normalizeTutorialLivePhase(v);
    cachedPhase = phase;
    return phase;
  } catch {
    return cachedPhase;
  }
}

export async function writeTutorialLivePhaseNative(
  phase: TutorialLivePhase | null
): Promise<void> {
  const next = !phase || phase === "done" ? null : phase;
  cachedPhase = next;
  notifyPhase(next);
  try {
    if (!next) {
      await AsyncStorage.removeItem(TUTORIAL_LIVE_PHASE_KEY);
      return;
    }
    await AsyncStorage.setItem(TUTORIAL_LIVE_PHASE_KEY, next);
  } catch {
    /* ignore */
  }
}
