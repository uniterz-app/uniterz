// /lib/follow.ts
import { db, auth } from "@/lib/firebase";
import {
  doc,
  collection,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

/**
 * フォローのトグル（既フォロー→解除／未フォロー→追加）
 * 成功時は { following: boolean } を返す
 */
export async function toggleFollow(targetUid: string): Promise<{ following: boolean }> {
  const me = auth.currentUser;
  if (!me) throw new Error("ログインが必要です");
  if (!targetUid) throw new Error("targetUid が空です");
  if (me.uid === targetUid) throw new Error("自分自身はフォローできません");

  // サブコレ参照
  const followerDoc = doc(collection(db, "users", targetUid, "followers"), me.uid);
  const followingDoc = doc(collection(db, "users", me.uid, "following"), targetUid);

  // 既にフォローしているか判定
  const snap = await getDoc(followerDoc);
  const alreadyFollowing = snap.exists();

  const batch = writeBatch(db);

  if (alreadyFollowing) {
    // 解除：ミラードキュメント削除（counts は触らない）
    batch.delete(followerDoc);
    batch.delete(followingDoc);
  } else {
    // 追加：ミラードキュメント作成（counts は触らない）
    batch.set(followerDoc, {
      by: me.uid,
      createdAt: serverTimestamp(),
    });
    batch.set(followingDoc, {
      to: targetUid,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return { following: !alreadyFollowing };
}

/** 一度だけの判定に便利：自分が target をフォローしているか */
export async function getIsFollowing(targetUid: string): Promise<boolean> {
  const me = auth.currentUser;
  if (!me) return false;
  const followerDoc = doc(collection(db, "users", targetUid, "followers"), me.uid);
  const snap = await getDoc(followerDoc);
  return snap.exists();
}
