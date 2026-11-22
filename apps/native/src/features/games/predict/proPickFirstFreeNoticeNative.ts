/** 初回無料 PRO PICK の案内モーダルを、端末で 1 回だけ出す */
import AsyncStorage from "@react-native-async-storage/async-storage";

function keyFor(uid: string): string {
  return `uniterz.proPick.firstFreeNotice.v1.${uid}`;
}

export async function readProPickFirstFreeNoticeSeenNative(uid: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(keyFor(uid))) === "1";
  } catch {
    return false;
  }
}

export async function markProPickFirstFreeNoticeSeenNative(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(uid), "1");
  } catch {
    // 容量超過などは握りつぶす
  }
}
