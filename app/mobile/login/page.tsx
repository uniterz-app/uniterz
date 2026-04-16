"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import LoginForm from "@/app/component/auth/LoginForm";
import AuthBackdrop from "@/app/component/auth/AuthBackdrop";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import type { Language } from "@/lib/i18n/language";
import { normalizeLanguage } from "@/lib/i18n/language";

export default function MobileLoginPage() {
  const { status, fUser } = useFirebaseUser();
  const router = useRouter();
  const [handle, setHandle] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);

  /* ------------------------------------
   * ① ログイン済みなら handle を読み込む
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
      router.replace(`/mobile/u/${encodeURIComponent(handle)}`);
      return;
    }
    router.replace("/mobile/onboarding");
  }, [status, fUser, handle, language, router]);

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
