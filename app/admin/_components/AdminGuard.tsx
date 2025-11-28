"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { ADMIN_UID } from "@/lib/constants";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { fUser, status } = useFirebaseUser();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const ok = fUser && fUser.uid === ADMIN_UID;
    if (!ok) {
      router.replace("/"); // 非管理者はトップへ
    }
  }, [fUser, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-[60svh] grid place-items-center text-white/60">
        認証確認中…
      </div>
    );
  }
  // いったん描画、useEffectで非管理者はリダイレクト
  return <>{children}</>;
}
