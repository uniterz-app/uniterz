import AsyncStorage from "@react-native-async-storage/async-storage";
import { FOOTBALL_SCORING_CHANGE_SEEN_STORAGE_KEY } from "../../../../../lib/predict/footballScoringChangeSeen";

export async function readFootballScoringChangeSeenNative(): Promise<boolean> {
  try {
    return (
      (await AsyncStorage.getItem(FOOTBALL_SCORING_CHANGE_SEEN_STORAGE_KEY)) ===
      "1"
    );
  } catch {
    return false;
  }
}

export async function markFootballScoringChangeSeenNative(): Promise<void> {
  try {
    await AsyncStorage.setItem(FOOTBALL_SCORING_CHANGE_SEEN_STORAGE_KEY, "1");
  } catch {
    // 無視
  }
}
