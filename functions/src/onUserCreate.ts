import * as functions from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = getFirestore();

  await db.collection("users").doc(user.uid).set({
    plan: "free",
    proUntil: null,
    createdAt: FieldValue.serverTimestamp(),
  });
});
