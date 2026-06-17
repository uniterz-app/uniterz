/** リーダーボード intro 既読（AsyncStorage） */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "uniterz:leaderboardsGroupsIntroSeen:v1";

export async function readLeaderboardsIntroSeenNative(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function markLeaderboardsIntroSeenNative(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // 握りつぶす
  }
}
