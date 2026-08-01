"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import ProfilePlanProSkinPicker from "@/app/component/profile/pro/ProfilePlanProSkinPicker";
import { isAuthStateResolved, useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { parseUserPlanProBgVariant } from "@/lib/profile/profilePlanProBgVariantField";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { getUserDocDataCached } from "@/lib/user/userDocCache";

type Props = {
  platform: "mobile" | "web";
};

export default function ProSkinPage({ platform }: Props) {
  const router = useRouter();
  const { fUser, status } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const [ready, setReady] = useState(false);
  const [initialSelectedId, setInitialSelectedId] =
    useState<ProfilePlanProBgVariant | null>(null);

  useEffect(() => {
    if (!isAuthStateResolved(status)) return;
    if (!fUser) {
      router.replace(platform === "web" ? "/web/login" : "/mobile/login");
      return;
    }

    let alive = true;
    getUserDocDataCached(fUser.uid).then((data) => {
      if (!alive) return;
      setInitialSelectedId(parseUserPlanProBgVariant(data?.planProBgVariant));
      setReady(true);
    });

    return () => {
      alive = false;
    };
  }, [fUser, status, router, platform]);

  if (!ready) {
    return <div className="min-h-screen bg-[#03080d]" />;
  }

  const isWeb = platform === "web";

  return (
    <ProfileCyberPage
      title="SKIN"
      subtitle={
        language === "en"
          ? "Choose a Pro profile background skin."
          : "Pro プロフィール背景スキンを選べます。"
      }
      contentClassName={
        isWeb
          ? "max-w-6xl px-4 py-2 md:px-6 md:py-4"
          : "max-w-lg px-0 py-0 sm:px-0"
      }
    >
      <ProfilePlanProSkinPicker
        mode="production"
        platform={platform}
        initialSelectedId={initialSelectedId}
      />
    </ProfileCyberPage>
  );
}
