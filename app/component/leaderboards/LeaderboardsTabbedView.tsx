"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import RankingsCommunityPanel from "@/app/component/rankings/RankingsCommunityPanel";
import { auth } from "@/lib/firebase";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

type Props = {
  variant: "web" | "mobile";
};

export default function LeaderboardsTabbedView({ variant }: Props) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { language } = useUserLanguage(uid);
  const isWeb = variant === "web";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  return (
    <div className={isWeb ? "pt-6" : undefined}>
      <RankingsCommunityPanel language={language} variant={variant} active />
    </div>
  );
}
