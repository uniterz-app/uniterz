"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import TermsDocument from "@/app/component/legal/TermsDocument";
import { TERMS_INTRO, TERMS_UPDATED_AT } from "@/lib/legal/termsCopy";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function WebTermsPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isJa = language === "ja";

  return (
    <LegalPageLayout
      variant="web"
      title="TERMS"
      description={isJa ? TERMS_INTRO.ja : TERMS_INTRO.en}
      updatedAt={TERMS_UPDATED_AT}
    >
      <TermsDocument language={isJa ? "ja" : "en"} />
    </LegalPageLayout>
  );
}
