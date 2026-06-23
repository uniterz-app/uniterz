/** 通知許可プリマー表示済み（ユーザー別） */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "uniterz:pushPermissionPrimerDismissed:v1:";

function storageKey(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

export async function readPushPermissionPrimerDismissedNative(
  uid: string
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(storageKey(uid))) === "1";
  } catch {
    return false;
  }
}

export async function markPushPermissionPrimerDismissedNative(
  uid: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(uid), "1");
  } catch {
    // 容量超過などは握りつぶす
  }
}
