/**
 * 投稿後の「次の試合も予想しますか？」案内を出さない設定。
 * 保存先は users/{uid}/private/displayPrefs の `nextGameModalSkip`（アカウント単位・端末をまたぐ）。
 * 旧版は端末の AsyncStorage にだけ保存していたので、初回に読んだときだけ移し替える。
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { USER_PRIVATE_DISPLAY_PREFS_DOC } from "@/lib/user/userPrivatePaths";
import { db } from "../../lib/firebase";

/** 旧版（端末ローカル）のキー。移行にだけ使う */
export const PREDICT_NEXT_GAME_MODAL_SKIP_KEY = "predict_next_game_modal_skip_v1";

/** displayPrefs 内のフィールド名 */
export const NEXT_GAME_MODAL_SKIP_FIELD = "nextGameModalSkip";

function displayPrefsRef(uid: string) {
  return doc(db, "users", uid, "private", USER_PRIVATE_DISPLAY_PREFS_DOC);
}

async function readLegacyLocalSkip(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREDICT_NEXT_GAME_MODAL_SKIP_KEY)) === "1";
  } catch {
    return false;
  }
}

async function clearLegacyLocalSkip(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREDICT_NEXT_GAME_MODAL_SKIP_KEY);
  } catch {
    // 無視
  }
}

/** 案内を止めているか。サーバーに値が無い旧ユーザーは端末の値を移してから返す */
export async function readPredictNextGameModalSkip(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(displayPrefsRef(uid));
    const raw = snap.exists() ? snap.data()?.[NEXT_GAME_MODAL_SKIP_FIELD] : undefined;
    if (typeof raw === "boolean") return raw;
    if (await readLegacyLocalSkip()) {
      await setDoc(
        displayPrefsRef(uid),
        { [NEXT_GAME_MODAL_SKIP_FIELD]: true, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await clearLegacyLocalSkip();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** 「今後この案内を表示しない」で閉じたとき */
export async function writePredictNextGameModalSkip(uid: string): Promise<void> {
  await setPredictNextGameModalSkip(uid, true);
}

/** 表示設定から切り替える。skip=false で再び出す */
export async function setPredictNextGameModalSkip(uid: string, skip: boolean): Promise<void> {
  await setDoc(
    displayPrefsRef(uid),
    { [NEXT_GAME_MODAL_SKIP_FIELD]: skip, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await clearLegacyLocalSkip();
}
