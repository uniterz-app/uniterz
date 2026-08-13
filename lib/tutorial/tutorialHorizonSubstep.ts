/**
 * horizon サブステップ（Web sessionStorage）
 */
const KEY = "uniterz_tutorial_horizon_substep";

export function readTutorialHorizonSubstep(): number {
  if (typeof sessionStorage === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

export function writeTutorialHorizonSubstep(step: number): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, String(Math.max(0, step)));
  } catch {
    /* ignore */
  }
}
