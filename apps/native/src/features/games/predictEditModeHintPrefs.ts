import AsyncStorage from "@react-native-async-storage/async-storage";

/** 編集モード説明の Alert を一度だけ出すためのフラグ */
const EDIT_MODE_HINT_KEY = "predict_edit_mode_hint_shown_v1";

export async function readEditModeHintShown(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(EDIT_MODE_HINT_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function writeEditModeHintShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(EDIT_MODE_HINT_KEY, "1");
  } catch {
    // 無視
  }
}
