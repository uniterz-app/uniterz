"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import TokushohoDocument from "@/app/component/legal/TokushohoDocument";
import {
  TOKUSHOHO_UPDATED_AT,
  tokushohoLead,
} from "@/lib/legal/tokushohoCopy";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function MobileLawPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const lang = language === "en" ? "en" : "ja";

  return (
    <LegalPageLayout
      variant="mobile"
      title="LAW"
      description={tokushohoLead(lang)}
      updatedAt={TOKUSHOHO_UPDATED_AT}
    >
      <TokushohoDocument language={lang} />
    </LegalPageLayout>
  );
}
