"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import PrivacyDocument from "@/app/component/legal/PrivacyDocument";
import { PRIVACY_INTRO, PRIVACY_UPDATED_AT } from "@/lib/legal/privacyCopy";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function WebPrivacyPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isJa = language === "ja";

  return (
    <LegalPageLayout
      variant="web"
      title="PRIVACY"
      description={isJa ? PRIVACY_INTRO.ja : PRIVACY_INTRO.en}
      updatedAt={PRIVACY_UPDATED_AT}
    >
      <PrivacyDocument language={isJa ? "ja" : "en"} />
    </LegalPageLayout>
  );
}
