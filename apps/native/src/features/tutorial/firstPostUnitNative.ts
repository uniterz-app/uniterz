/**
 * 新規登録の初期設定を終えた人の「最初の予想」で、UNIT の案内を 1 回だけ出すための印。
 * 初期設定の開始時に立て、最初の投稿で消費する（既存ユーザーには立たない）。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "uniterz:firstPostUnitPending:v1:";

function key(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

export async function markFirstPostUnitPendingNative(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(uid), "1");
  } catch {
    /* ignore */
  }
}

/** 立っていれば消して true。立っていなければ false */
export async function takeFirstPostUnitPendingNative(uid: string): Promise<boolean> {
  try {
    const on = (await AsyncStorage.getItem(key(uid))) === "1";
    if (on) await AsyncStorage.removeItem(key(uid));
    return on;
  } catch {
    return false;
  }
}
