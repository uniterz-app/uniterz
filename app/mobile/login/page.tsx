"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import LoginForm from "@/app/component/auth/LoginForm";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function MobileLoginPage() {
  const { status, fUser } = useFirebaseUser();
  const [handle, setHandle] = useState<string | null>(null);

  /* ------------------------------------
   * ① ログイン済みなら handle を読み込む
   * ------------------------------------ */
  useEffect(() => {
    if (!fUser) return;

    const loadHandle = async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      const h = snap.data()?.handle || snap.data()?.slug;
      setHandle(h || null);
    };

    loadHandle();
  }, [fUser]);

  /* ------------------------------------
   * ② 画面を絶対に出さない条件
   * ------------------------------------ */

  // Firebase 読み込み中 → 表示しない
  if (status === "loading") return null;

  // ログイン済みで handle 未取得 → 表示しない
  if (status === "ready" && fUser && !handle) return null;

  // ログイン済みで handle 取得済み → AuthGate に任せるので return null
  if (status === "ready" && fUser && handle) return null;

  /* ------------------------------------
   * ③ この時点で guest のみ → login を表示
   * ------------------------------------ */

  return (
    <AuthBackdrop>
      <LoginForm variant="mobile" />
    </AuthBackdrop>
  );
}
