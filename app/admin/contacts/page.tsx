"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminGuard from "../_components/AdminGuard";
import AdminInboxListClient from "@/app/component/admin/AdminInboxListClient";
import type { AdminInboxKind } from "@/lib/admin/adminInbox";

function ContactsInbox() {
  const searchParams = useSearchParams();
  const kind: AdminInboxKind =
    searchParams.get("kind") === "feature" ? "feature" : "inbox";
  const title = kind === "feature" ? "機能リクエスト" : "問い合わせ";

  return (
    <div className="p-1 md:p-2">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/contacts?kind=feature"
            className={[
              "border px-3 py-1 text-xs font-semibold tracking-wide",
              kind === "feature"
                ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-200"
                : "border-white/15 text-white/50 hover:text-white/80",
            ].join(" ")}
          >
            機能リクエスト
          </Link>
          <Link
            href="/admin/contacts?kind=inbox"
            className={[
              "border px-3 py-1 text-xs font-semibold tracking-wide",
              kind === "inbox"
                ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-200"
                : "border-white/15 text-white/50 hover:text-white/80",
            ].join(" ")}
          >
            問い合わせ
          </Link>
        </div>
      </div>
      <AdminInboxListClient
        kind={kind}
        itemHref={(id) => `/admin/contacts/${id}`}
      />
    </div>
  );
}

export default function AdminContactsPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<p className="p-5 text-sm text-white/50">読み込み中…</p>}>
        <ContactsInbox />
      </Suspense>
    </AdminGuard>
  );
}
