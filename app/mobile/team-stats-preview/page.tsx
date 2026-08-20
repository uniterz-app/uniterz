"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 旧 Team Stats URL → STATS ハブへ */
export default function MobileTeamStatsPreviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/mobile/stats-preview?tab=team");
  }, [router]);
  return null;
}
