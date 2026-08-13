/**
 * horizon 内のサブステップ（プロフィール ↔ Games の STATS 説明用）
 */
import {
  HORIZON_FEATURE_STEP_COUNT,
  TUTORIAL_HORIZON_STATS_STEP,
} from "../../../../../lib/tutorial/tutorialHorizonSteps";

type Listener = () => void;

const listeners = new Set<Listener>();
let substep = 0;

export function getTutorialHorizonSubstepNative(): number {
  return Math.min(substep, HORIZON_FEATURE_STEP_COUNT - 1);
}

export function setTutorialHorizonSubstepNative(next: number): void {
  substep = Math.max(0, Math.min(next, HORIZON_FEATURE_STEP_COUNT - 1));
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeTutorialHorizonSubstepNative(
  fn: Listener
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export { TUTORIAL_HORIZON_STATS_STEP, HORIZON_FEATURE_STEP_COUNT };
