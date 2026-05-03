import AsyncStorage from "@react-native-async-storage/async-storage";

/** モバイルWeb `lib/predict/nextGameModalPrefs` と同じキー */
export const PREDICT_NEXT_GAME_MODAL_SKIP_KEY = "predict_next_game_modal_skip_v1";

export async function readPredictNextGameModalSkip(): Promise<boolean> {
  try {
    return (
      (await AsyncStorage.getItem(PREDICT_NEXT_GAME_MODAL_SKIP_KEY)) === "1"
    );
  } catch {
    return false;
  }
}

export async function writePredictNextGameModalSkip(): Promise<void> {
  try {
    await AsyncStorage.setItem(PREDICT_NEXT_GAME_MODAL_SKIP_KEY, "1");
  } catch {
    // 無視
  }
}
