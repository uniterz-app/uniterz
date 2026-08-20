"use client";

import AdminGuard from "@/app/admin/_components/AdminGuard";
import AdminRedemptionsListClient from "@/app/component/admin/AdminRedemptionsListClient";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";

export default function MobileAdminRedemptionsPage() {
  return (
    <AdminGuard fallbackHref="/mobile">
      <ProfileCyberPage
        eyebrow="ADMIN"
        title="REDEEM"
        subtitle="ユーザーの商品交換申請です。未処理は赤バッジで表示されます。"
        contentClassName="max-w-lg px-4 py-4"
      >
        <AdminRedemptionsListClient
          itemHref={(id) => `/mobile/admin/redemptions/${id}`}
        />
      </ProfileCyberPage>
    </AdminGuard>
  );
}
