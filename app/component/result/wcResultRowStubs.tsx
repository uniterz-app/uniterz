/** NBA-only: stubs for removed WC result rows */
"use client";

import type { PredictionPostV2 } from "@/types/prediction-post-v2";

export function useWcGoalScorerResult(_post?: PredictionPostV2) {
  return null;
}

export function useWcPkWinnerResult(_post?: PredictionPostV2) {
  return null;
}

export function WcGoalScorerResultRow(_props: Record<string, unknown>) {
  return null;
}

export function WcPkWinnerResultRow(_props: Record<string, unknown>) {
  return null;
}
