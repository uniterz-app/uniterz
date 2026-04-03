/** 投稿後「次の試合を予測」モーダルを出さない（localStorage） */
export const PREDICT_NEXT_GAME_MODAL_SKIP_KEY = "predict_next_game_modal_skip_v1";

export function readPredictNextGameModalSkip(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREDICT_NEXT_GAME_MODAL_SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePredictNextGameModalSkip(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREDICT_NEXT_GAME_MODAL_SKIP_KEY, "1");
  } catch {
    /* ignore */
  }
}
