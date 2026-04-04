// lib/firebaseAdmin.ts
// インポート時に initializeApp しない（失敗時に API 全体が HTML エラーになるのを防ぐ）
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

/** サービスアカウント JSON の private_key を .env に入れるときの正規化 */
function normalizePrivateKey(raw: string): string {
  let k = raw.trim();
  // 環境変数で「\n」が2文字のとき → 改行に変換
  k = k.replace(/\\n/g, "\n");
  // 稀に改行がスペースだけになっている
  k = k.replace(/\r\n/g, "\n");
  return k.trim();
}

function initApp(): App {
  if (_app) return _app;

  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY!;
  const privateKey = normalizePrivateKey(privateKeyRaw ?? "");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
    );
  }

  const hasPem =
    privateKey.includes("BEGIN PRIVATE KEY") ||
    privateKey.includes("BEGIN RSA PRIVATE KEY");
  if (!hasPem) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY が PEM 形式ではありません。JSON の private_key 全体をコピーしてください（-----BEGIN...-----END...）。"
    );
  }
  // 実キーは通常 1500 文字超。.env で1行目だけ読まれていると数十文字になることが多い
  if (privateKey.length < 200) {
    throw new Error(
      `FIREBASE_PRIVATE_KEY が短すぎます（読み取り ${privateKey.length} 文字）。` +
        `サービスアカウント JSON の private_key を「1行」で .env.local に書いてください。` +
        `ダブルクォートで全体を囲み、改行は \\n のままにします（Enter で複数行に分けない）。`
    );
  }

  _app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
  return _app;
}

export function getAdminDb(): Firestore {
  if (!_db) {
    _db = getFirestore(initApp());
  }
  return _db;
}

export function getAdminAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(initApp());
  }
  return _auth;
}

/** 後方互換: `import { adminDb, adminAuth }` も有効（初回アクセス時に初期化） */
function lazyDbProxy(): Firestore {
  return new Proxy({} as Firestore, {
    get(_, prop) {
      const db = getAdminDb();
      const v = Reflect.get(db as object, prop, db);
      return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(db) : v;
    },
  });
}

function lazyAuthProxy(): Auth {
  return new Proxy({} as Auth, {
    get(_, prop) {
      const auth = getAdminAuth();
      const v = Reflect.get(auth as object, prop, auth);
      return typeof v === "function"
        ? (v as (...a: unknown[]) => unknown).bind(auth)
        : v;
    },
  });
}

export const adminDb = lazyDbProxy();
export const adminAuth = lazyAuthProxy();
