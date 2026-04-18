"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import SignupForm from "@/app/component/auth/SignupForm";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import type { Language } from "@/lib/i18n/language";
import { normalizeLanguage } from "@/lib/i18n/language";

export default function MobileSignupPage() {
  const { status, fUser } = useFirebaseUser();
  const router = useRouter();
  const [handle, setHandle] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);

  /* ------------------------------------
   * ① ログイン済みの場合 → handle を読み込む
   * ------------------------------------ */
  useEffect(() => {
    if (!fUser) return;

    const loadHandle = async () => {
      const data = await getUserDocDataCached(fUser.uid);
      const h = data?.handle || data?.slug;
      setHandle(h || null);
      setLanguage(normalizeLanguage(data?.language));
    };

    loadHandle();
  }, [fUser]);

  useEffect(() => {
    if (status !== "ready" || !fUser) return;
    if (handle && language) {
      router.replace("/mobile/games");
      return;
    }
    router.replace("/mobile/onboarding");
  }, [status, fUser, handle, language, router]);

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
