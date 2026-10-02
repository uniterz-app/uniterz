"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsAdmin } from "@/lib/admin/useIsAdmin";

export default function AdminGuard({
  children,
  fallbackHref = "/",
}: {
  children: React.ReactNode;
  fallbackHref?: string;
}) {
  const { isAdmin, loading } = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      router.replace(fallbackHref);
    }
  }, [isAdmin, loading, router, fallbackHref]);

  if (loading) {
    return (
      <div className="min-h-[60svh] grid place-items-center text-white/60">
        認証確認中…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[60svh] grid place-items-center text-white/60">
        権限がありません
      </div>
    );
  }
  return <>{children}</>;
}
