import type { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

/**
 * 新規登録直後の users/{uid}。Functions `onUserCreate` が先に doc を作ると
 * この書き込みは update 扱いになり、ルール上 createdAt / counts を書けない
 */
export async function initNewUserDocNative(
  uid: string,
  photoURL: string | null | undefined
): Promise<void> {
  const ref = doc(db, "users", uid);
  const profile = { displayName: "", bio: "", photoURL: photoURL ?? "" };
  try {
    await setDoc(
      ref,
      { ...profile, createdAt: serverTimestamp(), counts: { posts: 0 } },
      { merge: true }
    );
  } catch (e) {
    if ((e as FirebaseError | undefined)?.code !== "permission-denied") throw e;
    await setDoc(ref, profile, { merge: true });
  }
}
