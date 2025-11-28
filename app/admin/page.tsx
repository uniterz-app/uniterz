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
          href="/admin/announcements"
          title="お知らせ管理"
          desc="一覧・ピン留め・公開/非公開・作成/編集"
        />
        <Card
          href="/admin/announcements/new"
          title="お知らせを作成"
          desc="新規作成（画像アップロード・本文編集）"
        />
        <Card
          href="/admin/games-import"
          title="試合データ インポート"
          desc="JSONプレビュー → Firestoreへ一括書込み"
        />
        {/* 先々のプレースホルダ */}
        <Card
          href="/admin/plans"
          title="プラン管理（準備中）"
          desc="申請承認・公開設定・価格調整など"
        />
      </div>
    </AdminGuard>
  );
}
