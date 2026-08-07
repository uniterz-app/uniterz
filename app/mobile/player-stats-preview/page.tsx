"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 旧 Player Stats URL → STATS ハブ（Player タブ）へ */
export default function MobilePlayerStatsPreviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mobile/stats-preview?tab=player");
  }, [router]);
  return null;
}
