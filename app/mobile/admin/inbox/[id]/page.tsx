"use client";

import { use } from "react";
import AdminGuard from "@/app/admin/_components/AdminGuard";
import AdminInboxDetailClient from "@/app/component/admin/AdminInboxDetailClient";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";

export default function MobileAdminInboxDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);

  return (
    <AdminGuard fallbackHref="/mobile">
      <ProfileCyberPage
        eyebrow="ADMIN"
        title="DETAIL"
        subtitle="ユーザーから届いた内容です。"
        contentClassName="max-w-lg px-4 py-4"
      >
        <AdminInboxDetailClient contactId={id} />
      </ProfileCyberPage>
    </AdminGuard>
  );
}
