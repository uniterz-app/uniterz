// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId     = process.env.FIREBASE_PROJECT_ID!;
const clientEmail   = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY!;


// 改行エスケープ対応（.env の \n を本物の改行へ）
const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase Admin env: FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY"
  );
}

// Admin SDK はサーバー専用。複数初期化を避けるため getApps() でガード
const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
