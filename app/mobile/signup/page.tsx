"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import SignupForm from "@/app/component/auth/SignupForm";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function MobileSignupPage() {
  const { status, fUser } = useFirebaseUser();
  const [handle, setHandle] = useState<string | null>(null);

  /* ------------------------------------
   * ① ログイン済みの場合 → handle を読み込む
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

  // ⭐ Firebase がまだ判定中 → 何も出さない
  if (status === "loading") return null;

  // ⭐ ログイン済みだが handle 未取得 → 絶対に表示しない（flash防止）
  if (status === "ready" && fUser && !handle) return null;

  // ⭐ ログイン済みで handle もある → AuthGate が redirect するので表示しない
  if (status === "ready" && fUser && handle) return null;

  /* ------------------------------------
   * ③ この時点で確実に「未ログイン guest」
   * ------------------------------------ */

  return (
    <AuthBackdrop>
      <SignupForm variant="mobile" />
    </AuthBackdrop>
  );
}
