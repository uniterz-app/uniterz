// lib/support/submitContact.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export type SubmitContactParams = {
  type: string;
  message: string;
  email?: string;
  screenshotUrl?: string;
  fromPath?: string;
  appVariant?: "web" | "mobile";
  userUid: string | null;
  userDisplayName: string | null;
};

export async function submitContact(params: SubmitContactParams) {
  const col = collection(db, "contacts");

  await addDoc(col, {
    type: params.type,
    message: params.message,
    email: params.email ?? null,
    screenshotUrl: params.screenshotUrl ?? null,
    fromPath: params.fromPath ?? null,
    appVariant: params.appVariant ?? null,
    userUid: params.userUid,
    userDisplayName: params.userDisplayName,
    status: "unread", // ★ 新規は未読
    createdAt: serverTimestamp(),
  });
}
