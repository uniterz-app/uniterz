// app/dev/profile-v2/page.tsx
"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import ProfilePageBaseV2 from "@/app/component/profile/ProfilePageBaseV2";

export default function ProfileV2PreviewPage() {
  const { fUser, status } = useFirebaseUser();

  if (status === "loading") {
    return <div className="text-white p-6">Loading...</div>;
  }

  if (!fUser) {
    return (
      <div className="text-white p-6">
        プレビューにはログインが必要です。
      </div>
    );
  }

  // Firestore の handle ではなく、プレビュー用の仮 handle を使う
  // ★ 本来は /users/{uid} から handle を取得するが、UI プレビューなのでこれで可
  const handle = fUser.displayName || fUser.email?.split("@")[0] || "";

  return (
    <div className="text-white">
      <ProfilePageBaseV2 handle={handle} variant="mobile" />
    </div>
  );
}
