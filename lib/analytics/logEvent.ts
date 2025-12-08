// lib/analytics/logEvent.ts
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type {
  GameEventType,
  ProfileEventType,
  LikeEventType,
} from "./eventTypes";

const DRY_RUN = false; // ← ここで実書き込みに切り替え

/** 端末ごとの簡易フィンガープリント（同一ブラウザで安定） */
function getOrCreateFingerprint() {
  const KEY = "uniterz_fp_v1";
  let fp = "";
  try {
    fp = localStorage.getItem(KEY) || "";
    if (!fp) {
      fp = crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
      localStorage.setItem(KEY, fp);
    }
  } catch (_) {
    // SSR/制限環境では空文字のまま
  }
  return fp;
}

/** 共通のメタを付与 */
function baseMeta() {
  const user = auth.currentUser;
  return {
    at: serverTimestamp(),
    actorUid: user?.uid ?? null,
    fingerprint: getOrCreateFingerprint(),
    ipHash: null as string | null, // クラ側では不明。将来CFで上書き可。
    ua: (typeof navigator !== "undefined" && navigator.userAgent) || "",
  };
}

/** 試合イベントを記録 */
export async function logGameEvent(payload: {
  type: GameEventType;
  gameId: string;
  league: string;
  ts?: number;
  weight?: number;
}) {

  const docData = { ...payload, ...baseMeta() };

  if (DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log("[DRY_RUN] events_game", docData);
    return;
  }

  await addDoc(collection(db, "events_game"), docData);
}

/** プロフィールイベントを記録（自分→自分は弾く） */
export async function logProfileEvent(payload: {
  type: ProfileEventType;
  uid: string; // 閲覧されたユーザーのuid
}) {
  const base = baseMeta();

  // ⚠ 自分のプロフィールを自分で開いた場合はトレンド対象にしない
  if (base.actorUid && base.actorUid === payload.uid) {
    if (DRY_RUN) {
      // eslint-disable-next-line no-console
      console.log(
        "[DRY_RUN] events_profile (self-view skipped)",
        payload,
        base
      );
    }
    return;
  }

  const docData = {
    ...base,
    type: payload.type, // "open_profile"
    // 互換用に複数のフィールドに入れておく
    uid: payload.uid,
    targetUid: payload.uid,
    visitedUid: payload.uid,
    createdAt: base.at, // 旧実装との互換用
  };

  if (DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log("[DRY_RUN] events_profile", docData);
    return;
  }

  await addDoc(collection(db, "events_profile"), docData);
}

/** 投稿へのいいねイベントを記録（トレンド用） */
export async function logLikeEvent(payload: {
  type: LikeEventType; // "like_post"
  postId: string; // いいねされた投稿ID
  authorUid: string; // その投稿の作者uid（= トレンド対象のユーザー）
}) {
  const base = baseMeta();

  const docData = {
    ...base,
    type: payload.type,
    postId: payload.postId,
    authorUid: payload.authorUid,
    targetUid: payload.authorUid, // 集計時のキー
    createdAt: base.at,
  };

  if (DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log("[DRY_RUN] events_like", docData);
    return;
  }

  await addDoc(collection(db, "events_like"), docData);
}
