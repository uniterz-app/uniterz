"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminGuard from "../_components/AdminGuard";

/** 旧 analytics ダッシュボード — 未使用のため /admin へ誘導 */
export default function AdminDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <AdminGuard>
      <div className="p-6 text-white/50 text-sm">リダイレクト中…</div>
    </AdminGuard>
  );
}
