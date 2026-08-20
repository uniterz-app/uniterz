"use client";

import Link from "next/link";
import AdminGuard from "./_components/AdminGuard";

const Card = ({
  href,
  title,
  desc,
}: { href: string; title: string; desc: string }) => (
  <Link
    href={href}
    className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5
               hover:bg-white/[0.06] transition
               shadow-[0_0_24px_rgba(0,229,255,0.08)] hover:shadow-[0_0_32px_rgba(0,229,255,0.14)]"
  >
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-sm text-white/60 mt-1">{desc}</div>
    <div className="mt-3 text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition">
      開く →
    </div>
  </Link>
);

export default function AdminHomePage() {
  return (
    <AdminGuard>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          href="/admin/contacts?kind=feature"
          title="機能リクエスト"
          desc="ユーザーからの要望・改善案"
        />
        <Card
          href="/admin/contacts?kind=inbox"
          title="問い合わせ"
          desc="不具合・通報・その他のお問い合わせ"
        />
        <Card
          href="/admin/redemptions"
          title="商品交換申請"
          desc="審査・購入・追跡番号の更新"
        />
      </div>
    </AdminGuard>
  );
}
