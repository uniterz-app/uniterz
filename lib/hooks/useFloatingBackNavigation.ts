"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import {
  clearSideMenuOrigin,
  hasSideMenuOrigin,
  requestOpenProfileSideMenu,
} from "@/lib/navigation/sideMenuReturnNav";

/**
 * フローティング戻る：サイドメニュー経由ならプロフィール＋ドロワー、それ以外は history.back
 */
export function useFloatingBackNavigation() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [uid, setUid] = useState<string | null>(null);
  const [profileHref, setProfileHref] = useState<string | null>(null);
  const [menuOrigin, setMenuOrigin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setProfileHref(null);
      return;
    }
    const mobile = pathname.startsWith("/mobile");
    const prefix = mobile ? "/mobile" : "/web";
    // ハンドル取得前でも戻り先を確定させる（読み込み中に back へ落ちない）
    setProfileHref(`${prefix}/mypage`);

    let alive = true;
    getUserDocDataCached(uid).then((data) => {
      if (!alive) return;
      const h = data?.handle || data?.slug;
      setProfileHref(
        h
          ? `${prefix}/u/${encodeURIComponent(String(h))}`
          : `${prefix}/mypage`
      );
    });
    return () => {
      alive = false;
    };
  }, [uid, pathname]);

  const refreshMenuOrigin = useCallback(() => {
    setMenuOrigin(hasSideMenuOrigin());
  }, []);

  useEffect(() => {
    refreshMenuOrigin();
  }, [pathname, refreshMenuOrigin]);

  useEffect(() => {
    const onVis = () => refreshMenuOrigin();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshMenuOrigin]);

  const goBack = useCallback(() => {
    if (hasSideMenuOrigin() && profileHref) {
      clearSideMenuOrigin();
      setMenuOrigin(false);
      requestOpenProfileSideMenu();
      router.push(profileHref);
      return;
    }
    router.back();
  }, [router, profileHref]);

  return {
    goBack,
    /** アクセシビリティ用：メニュー経由でプロフィールへ戻るか */
    prefersSideMenuAria: menuOrigin && Boolean(profileHref),
  };
}
