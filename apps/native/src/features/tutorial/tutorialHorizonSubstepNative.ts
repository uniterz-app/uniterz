/**
 * horizon 内のサブステップ
 */
import { HORIZON_FEATURE_STEP_COUNT } from "../../../../../lib/tutorial/tutorialHorizonSteps";

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

export { HORIZON_FEATURE_STEP_COUNT };
