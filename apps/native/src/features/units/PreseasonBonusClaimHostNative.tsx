/** Web `PreseasonBonusClaimHost` 相当 — 開幕前にアプリを開いたユーザーへ自動付与（描画なし） */
import { useEffect } from "react";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import {
  requestPreseasonBonus,
  shouldRequestPreseasonBonus,
} from "../../../../../lib/units/preseasonBonusClient";

export default function PreseasonBonusClaimHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";

  useEffect(() => {
    const base = getUniterzApiBaseUrl();
    if (!fUser || !base || !shouldRequestPreseasonBonus(uid)) return;
    void fUser
      .getIdToken()
      .then((token) => requestPreseasonBonus(base, uid, token))
      .catch(() => {});
  }, [fUser, uid]);

  return null;
}
