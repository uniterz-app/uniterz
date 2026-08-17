"use client";

import { useRouter } from "next/navigation";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";

/** LP サブページ用 — 右端 BACK タブで /lp に戻る */
export default function OfficialLpBackTab() {
  const router = useRouter();

  return (
    <ProfileMenuEdgeHandle
      onOpen={() => router.push("/lp")}
      label="BACK"
      tone="back"
      overlay
      ariaLabel="公式サイトへ戻る"
    />
  );
}
