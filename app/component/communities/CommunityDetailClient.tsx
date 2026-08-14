"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import Header from "@/app/component/Header";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import CommunityGroupDetailCard from "./CommunityGroupDetailCard";
import CommunityGroupDetailView from "./CommunityGroupDetailView";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";

type Props = {
  variant: "web" | "mobile";
  groupId: string;
};

export default function CommunityDetailClient({
  variant,
  groupId,
}: Props) {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { language } = useUserLanguage(uid);
  const isMobile = variant === "mobile";
  const leaderboardsHref = isMobile ? "/mobile/leaderboards" : "/web/leaderboards";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 min-h-screen pb-bottom-nav">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        {!uid ? null : (
          <div className={`mx-auto max-w-[640px] px-3 pt-2 ${jp.className}`}>
            <CommunityGroupDetailCard variant="page">
              <CommunityGroupDetailView
                groupId={groupId}
                language={language}
                variant={variant}
                headerBanner="wide_when_image"
                inDetailCard
              />
            </CommunityGroupDetailCard>
          </div>
        )}
      </div>
      <ProfileMenuEdgeHandle
        onOpen={() => router.push(leaderboardsHref)}
        label="BACK"
        tone="back"
        ariaLabel={language === "en" ? "Back" : "戻る"}
      />
    </div>
  );
}
