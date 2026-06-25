import { InteractionManager } from "react-native";
import { PREDICT_MODAL_EXIT_COMPLETION_MS } from "./predictMotion";

/**
 * PredictModal 閉鎖直後に Alert / 別 Modal を重ねると iOS でタッチが死ぬことがある。
 * ネイティブの dismiss 完了後に後続 UI を出す。
 */
export function scheduleAfterPredictModalDismissed(onReady: () => void) {
  const task = InteractionManager.runAfterInteractions(() => {
    setTimeout(onReady, PREDICT_MODAL_EXIT_COMPLETION_MS);
  });
  return () => task.cancel();
}
