"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import LeaderboardsGroupsIntroModal from "@/app/component/communities/LeaderboardsGroupsIntroModal";
import RankingsCommunityPanel from "@/app/component/rankings/RankingsCommunityPanel";
import { auth } from "@/lib/firebase";
import {
  markLeaderboardsGroupsIntroSeen,
  readLeaderboardsGroupsIntroSeen,
} from "@/lib/communities/leaderboardsGroupsIntroSeen";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

type Props = {
  variant: "web" | "mobile";
};

export default function LeaderboardsTabbedView({ variant }: Props) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { language } = useUserLanguage(uid);
  const isWeb = variant === "web";
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useLayoutEffect(() => {
    if (readLeaderboardsGroupsIntroSeen()) return;
    markLeaderboardsGroupsIntroSeen();
    setIntroOpen(true);
  }, []);

  return (
    <div
      className={[
        "relative min-h-0 text-white",
        isWeb ? "pt-6" : "pt-1",
      ].join(" ")}
    >
      <LeaderboardsGroupsIntroModal
        open={introOpen}
        language={language}
        onClose={() => setIntroOpen(false)}
      />
      <RankingsCommunityPanel language={language} variant={variant} active />
    </div>
  );
}
