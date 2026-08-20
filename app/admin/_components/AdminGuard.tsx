"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { isAdminUid } from "@/lib/constants";

export default function AdminGuard({
  children,
  fallbackHref = "/",
}: {
  children: React.ReactNode;
  fallbackHref?: string;
}) {
  const { fUser, status } = useFirebaseUser();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const ok = Boolean(fUser && isAdminUid(fUser.uid));
    if (!ok) {
      router.replace(fallbackHref);
    }
  }, [fUser, status, router, fallbackHref]);

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
