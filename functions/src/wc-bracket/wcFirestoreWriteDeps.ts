import { FieldValue } from "firebase-admin/firestore";
import type { FieldValue as FieldValueType } from "firebase-admin/firestore";

/** Firestore 書き込み用 sentinel（スクリプトと Functions で firebase-admin 実体を共有するため） */
export type WcFirestoreWriteDeps = {
  serverTimestamp: () => FieldValueType;
};

export const defaultWcFirestoreWriteDeps = (): WcFirestoreWriteDeps => ({
  serverTimestamp: () => FieldValue.serverTimestamp(),
});
