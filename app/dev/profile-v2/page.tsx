// app/dev/profile-v2/page.tsx
"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfilePageBaseV2 from "@/app/component/profile/ProfilePageBaseV2";

export default function ProfileV2PreviewPage() {
  const { fUser, status } = useFirebaseUser();

  if (status === "loading" || !fUser) {
    return (
      <div className="flex justify-center p-6 text-white">
        <CandleChartLoader />
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
