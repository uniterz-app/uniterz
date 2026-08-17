/**
 * horizon サブステップ（Web sessionStorage）
 */
import { HORIZON_FEATURE_STEP_COUNT } from "@/lib/tutorial/tutorialHorizonSteps";

const KEY = "uniterz_tutorial_horizon_substep";

function clampHorizonSubstep(n: number): number {
  return Math.max(0, Math.min(n, HORIZON_FEATURE_STEP_COUNT - 1));
}

export function readTutorialHorizonSubstep(): number {
  if (typeof sessionStorage === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? clampHorizonSubstep(n) : 0;
  } catch {
    return 0;
  }
}

export function writeTutorialHorizonSubstep(step: number): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, String(clampHorizonSubstep(step)));
  } catch {
    /* ignore */
  }
}
