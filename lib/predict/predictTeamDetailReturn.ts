import type { NbaPredictToolsTabId } from "@/lib/predict/nbaTeamDetailHref";
import { isSafeFirestoreDocId } from "@/lib/predict/nbaTeamDetailHref";

const STORAGE_KEY = "uniterz:predict-team-detail-return";

export type PredictTeamDetailReturnMode = "overlay" | "route";

export type PredictTeamDetailReturn = {
  gameId: string;
  predictToolsTab?: NbaPredictToolsTabId;
  returnMode: PredictTeamDetailReturnMode;
};

export function stashPredictTeamDetailReturn(ctx: PredictTeamDetailReturn): void {
  if (typeof sessionStorage === "undefined") return;
  if (!isSafeFirestoreDocId(ctx.gameId)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* quota / private mode */
  }
}

export function peekPredictTeamDetailReturn(): PredictTeamDetailReturn | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PredictTeamDetailReturn;
    if (!isSafeFirestoreDocId(parsed?.gameId)) return null;
    if (parsed.returnMode !== "overlay" && parsed.returnMode !== "route") {
      return { ...parsed, returnMode: "route" };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function consumePredictTeamDetailReturn(): PredictTeamDetailReturn | null {
  const ctx = peekPredictTeamDetailReturn();
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  return ctx;
}
