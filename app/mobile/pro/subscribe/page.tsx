"use client";

import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import ProSubscribePreview from "@/app/component/pro/dev/ProSubscribePreview";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function MobileProSubscribePage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);

  return (
    <ProfileCyberPage
      title="PRO"
      subtitle={
        language === "en"
          ? "Upgrade to Pro for skins and premium features."
          : "スキンやプレミアム機能を使える Pro プランです。"
      }
      contentClassName="max-w-xl px-3 py-4 sm:px-4"
    >
      <ProSubscribePreview language={language} />
    </ProfileCyberPage>
  );
}
