import { InteractionManager } from "react-native";
import { PREDICT_MODAL_EXIT_COMPLETION_MS } from "./predictMotion";

/** 退場アニメ後に Modal が外れてから、ネイティブの dismiss が終わるまでの余裕 */
const NATIVE_MODAL_DISMISS_BUFFER_MS = 280;

/**
 * PredictModal 閉鎖直後に Alert / 別 Modal を重ねると iOS でタッチが死ぬことがある。
 * 送信成功時は退場アニメ完了まで Modal が残るため、その後のネイティブ dismiss 完了を待って後続 UI を出す。
 */
export function scheduleAfterPredictModalDismissed(onReady: () => void) {
  const task = InteractionManager.runAfterInteractions(() => {
    setTimeout(
      onReady,
      PREDICT_MODAL_EXIT_COMPLETION_MS + NATIVE_MODAL_DISMISS_BUFFER_MS
    );
  });
  return () => task.cancel();
}
