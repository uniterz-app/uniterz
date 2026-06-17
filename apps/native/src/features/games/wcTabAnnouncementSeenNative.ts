import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "wcGamesTabAnnouncementSeen";

export async function readWcGamesTabAnnouncementSeenNative(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function markWcGamesTabAnnouncementSeenNative(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    // ignore
  }
}
