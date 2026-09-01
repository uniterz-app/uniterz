"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** @deprecated `/mobile/team-detail-preview` へリダイレクト */
export default function LegacyTeamDetailRedirectPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();

  useEffect(() => {
    const raw = params?.teamId;
    const teamId = typeof raw === "string" ? raw.trim() : "";
    if (teamId) {
      router.replace(
        `/mobile/team-detail-preview?teamId=${encodeURIComponent(teamId)}`
      );
      return;
    }
    router.replace("/mobile/games");
  }, [params?.teamId, router]);

  return null;
}
