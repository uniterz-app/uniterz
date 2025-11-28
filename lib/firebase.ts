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

// 🔥 永続ログイン設定（PWA / Safari で毎回ログアウトになる問題の修正）
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((e) => {
    console.error("Auth persistence set error:", e);
  });
}

export const storage: FirebaseStorage = getStorage(app);
export const db: Firestore = getFirestore(app);

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
