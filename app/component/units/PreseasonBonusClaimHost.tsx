"use client";

/** 開幕前にログインしたユーザーへプレシーズン参加ボーナスを自動付与（描画なし） */
import { useEffect } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import {
  requestPreseasonBonus,
  shouldRequestPreseasonBonus,
} from "@/lib/units/preseasonBonusClient";

export default function PreseasonBonusClaimHost() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";

  useEffect(() => {
    if (!fUser || !shouldRequestPreseasonBonus(uid)) return;
    void fUser
      .getIdToken()
      .then((token) => requestPreseasonBonus("", uid, token))
      .catch(() => {});
  }, [fUser, uid]);

  return null;
}
