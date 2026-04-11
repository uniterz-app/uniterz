// lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import {
  getFirestore,
  type Firestore,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";

// ★ 追加：Functions
import { getFunctions, type Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
};

// --- SSR/Hot Reload 対策：多重初期化を回避 ---
const app: FirebaseApp =
  getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);

// --- Auth 初期化 ---
export const auth: Auth = getAuth(app);

/**
 * 永続化の適用と初期セッション復元が終わるまで待つ Promise。
 * これより前に guest と判定すると、ログイン済みでも一瞬 LP へ飛ぶことがある（特にモバイル）。
 */
export const authInitialization: Promise<void> =
  typeof window !== "undefined"
    ? setPersistence(auth, browserLocalPersistence)
        .catch((e) => {
          console.error("Auth persistence set error:", e);
        })
        .then(() => auth.authStateReady())
    : Promise.resolve();

export const storage: FirebaseStorage = getStorage(app);
export const db: Firestore = getFirestore(app);

// ★ 追加：Functions 初期化
export const functions: Functions = getFunctions(app, "asia-northeast1");

export { app };

// --- ここからデバッグ用（ブラウザだけ有効） ---
if (typeof window !== "undefined") {
  // Firestore をブラウザコンソールから触れるように
  (window as any)._db = db;
  (window as any)._appProjectId = app.options.projectId;

  (window as any)._fs = {
    getDocs,
    collection,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
  };

  try {
    if (!(window as any).__FB_PROJECT_LOGGED__) {
      console.log("[FB] projectId =", app.options.projectId);
      (window as any).__FB_PROJECT_LOGGED__ = true;
    }
  } catch {}
}
