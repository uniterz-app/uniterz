"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import Header from "@/app/component/Header";
import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import CommunityGroupDetailView from "./CommunityGroupDetailView";

type Props = {
  variant: "web" | "mobile";
  groupId: string;
};

export default function CommunityDetailClient({
  variant,
  groupId,
}: Props) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { language } = useUserLanguage(uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  return (
    <div className="relative min-h-screen bg-app">
      <div className="pointer-events-none fixed inset-0 z-0">
        <CyberPageBackground />
      </div>
      <div className="relative z-10 min-h-screen pb-bottom-nav">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        {!uid ? null : (
        <div className={`mx-auto max-w-[640px] px-0 pt-0 sm:px-3 sm:pt-2 ${jp.className}`}>
          <CommunityGroupDetailView
            groupId={groupId}
            language={language}
            variant={variant}
            headerBanner="wide_when_image"
            showBackLink
          />
        </div>
        )}
      </div>
    </div>
  );
}
