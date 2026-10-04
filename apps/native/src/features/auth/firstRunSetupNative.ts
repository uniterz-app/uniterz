/** Web `lib/onboarding/firstRunSetupWeb` 相当 — 初期設定確認の pending（ユーザー別・端末） */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firstRunSetupPendingKey } from "../../../../../lib/onboarding/firstRunSetup";

/** オンボーディング完了直後に Main が先に読むことがあるためメモリにも持つ */
const pendingMemory = new Set<string>();

export async function markFirstRunSetupPendingNative(uid: string): Promise<void> {
  pendingMemory.add(uid);
  try {
    await AsyncStorage.setItem(firstRunSetupPendingKey(uid), "1");
  } catch {
    // 容量超過などは握りつぶす
  }
}

export async function readFirstRunSetupPendingNative(uid: string): Promise<boolean> {
  if (pendingMemory.has(uid)) return true;
  try {
    return (await AsyncStorage.getItem(firstRunSetupPendingKey(uid))) === "1";
  } catch {
    return false;
  }
}

export async function clearFirstRunSetupPendingNative(uid: string): Promise<void> {
  pendingMemory.delete(uid);
  try {
    await AsyncStorage.removeItem(firstRunSetupPendingKey(uid));
  } catch {
    // 握りつぶす
  }
}
