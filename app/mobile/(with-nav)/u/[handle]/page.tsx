"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import ProfilePageBase from "@/app/component/profile/ProfilePageBase";

/* ログ */
import { logProfileEvent } from "@/lib/analytics/logEvent";
import { PROFILE_EVENT } from "@/lib/analytics/eventTypes";

/* Firestore */
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export default function Page() {
  // ✅ useParams で取得（将来仕様に対応）
  const params = useParams<{ handle: string }>();
  const handle = useMemo(() => {
    const raw =
      typeof params?.handle === "string"
        ? params.handle
        : Array.isArray(params?.handle)
        ? params.handle[0]
        : "";
    return decodeURIComponent(raw);
  }, [params]);

  // JST YYYY-MM-DD（同日ユニーク制御）
  const dayKeyJst = useMemo(
    () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10),
    []
  );

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;

    async function logOncePerDay() {
      try {
        // handle → uid を1件取得
        const qref = query(
          collection(db, "users"),
          where("handle", "==", handle),
          limit(1)
        );
        const snap = await getDocs(qref);
        if (cancelled || snap.empty) return;

        const uid = snap.docs[0].id;
        const storageKey = `uniterz_profile_opened:${uid}:${dayKeyJst}`;
        if (localStorage.getItem(storageKey)) return;

        // ✅ 正しいペイロード型で記録
        void logProfileEvent({ type: PROFILE_EVENT.OPEN_PROFILE, uid });

        localStorage.setItem(storageKey, "1");
      } catch (e) {
        console.warn("open_profile log skipped (mobile)", e);
      }
    }

    logOncePerDay();
    return () => {
      cancelled = true;
    };
  }, [handle, dayKeyJst]);

  return <ProfilePageBase handle={handle} variant="mobile" />;
}
