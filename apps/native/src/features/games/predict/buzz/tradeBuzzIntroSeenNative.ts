/**
 * トレード Buzz の初回説明。端末に 1 回だけ。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "uniterz:tradeBuzzIntroSeen:v1";

export async function hasSeenTradeBuzzIntroNative(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return true;
  }
}

export async function markTradeBuzzIntroSeenNative(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    // 保存できなくても次回もう一度出るだけ
  }
}
