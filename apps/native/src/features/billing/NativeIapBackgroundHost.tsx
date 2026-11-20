import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeIapBackgroundPurchases } from "./useNativeIap";

/** 購入画面の外で届く購入（後払いの完了・前回検証に失敗した取引）をサーバーへ送る */
export default function NativeIapBackgroundHost() {
  const { fUser, status } = useFirebaseUser();
  useNativeIapBackgroundPurchases(status === "ready" && !!fUser?.uid);
  return null;
}
