"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminGuard from "@/app/admin/_components/AdminGuard";
import AdminInboxListClient from "@/app/component/admin/AdminInboxListClient";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import type { AdminInboxKind } from "@/lib/admin/adminInbox";

function InboxInner() {
  const searchParams = useSearchParams();
  const kind: AdminInboxKind =
    searchParams.get("kind") === "feature" ? "feature" : "inbox";
  const isFeature = kind === "feature";

  return (
    <ProfileCyberPage
      eyebrow="ADMIN"
      title={isFeature ? "REQUESTS" : "INBOX"}
      subtitle={
        isFeature
          ? "ユーザーから届いた機能リクエストです。開くと既読になります。"
          : "ユーザーから届いた問い合わせです。開くと既読になります。"
      }
      contentClassName="max-w-lg px-4 py-4"
    >
      <AdminInboxListClient
        kind={kind}
        itemHref={(id) => `/mobile/admin/inbox/${id}`}
      />
    </ProfileCyberPage>
  );
}

export default function MobileAdminInboxPage() {
  return (
    <AdminGuard fallbackHref="/mobile">
      <Suspense fallback={<p className="p-5 text-sm text-white/50">読み込み中…</p>}>
        <InboxInner />
      </Suspense>
    </AdminGuard>
  );
}
