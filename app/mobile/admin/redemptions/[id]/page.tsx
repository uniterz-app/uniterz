"use client";

import { use } from "react";
import AdminGuard from "@/app/admin/_components/AdminGuard";
import AdminRedemptionDetailClient from "@/app/component/admin/AdminRedemptionDetailClient";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";

export default function MobileAdminRedemptionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);

  return (
    <AdminGuard fallbackHref="/mobile">
      <ProfileCyberPage
        eyebrow="ADMIN"
        title="REDEEM"
        subtitle="申請内容の確認とステータス更新。"
        contentClassName="max-w-lg px-4 py-4"
      >
        <AdminRedemptionDetailClient redemptionId={id} />
      </ProfileCyberPage>
    </AdminGuard>
  );
}
