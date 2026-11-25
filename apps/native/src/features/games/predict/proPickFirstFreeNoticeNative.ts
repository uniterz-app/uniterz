/**
 * 初回 PRO PICK 無料の案内を、アカウントごとに 1 回だけ出す（予想ページを開いたとき）。
 * ギフト自体（サーバーの first_free）とは別。あとで閉じてもゲートの無料ボタンは残る。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "uniterz:proPickFirstFreeNoticeSeen:v1:";

function key(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

export async function hasProPickFirstFreeNoticeSeenNative(
  uid: string
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(uid))) === "1";
  } catch {
    return false;
  }
}

export async function markProPickFirstFreeNoticeSeenNative(
  uid: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(key(uid), "1");
  } catch {
    /* ignore */
  }
}
