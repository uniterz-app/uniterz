/**
 * 初回 PRO PICK 無料の案内モーダルを、アカウントごとに 1 回だけ出す。
 * ギフト自体（サーバーの first_free）とは別。閉じてもゲートの無料ボタンは残る。
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
