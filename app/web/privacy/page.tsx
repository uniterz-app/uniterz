"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import LegalDocument from "@/app/component/legal/LegalDocument";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED_AT } from "@/lib/legal/privacyCopy";
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
      <LegalDocument language={isJa ? "ja" : "en"} sections={PRIVACY_SECTIONS} />
    </LegalPageLayout>
  );
}
