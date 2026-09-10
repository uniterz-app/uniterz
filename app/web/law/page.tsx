"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import TokushohoDocument from "@/app/component/legal/TokushohoDocument";
import {
  TOKUSHOHO_UPDATED_AT,
  tokushohoLead,
} from "@/lib/legal/tokushohoCopy";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function WebLawPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const lang = language === "ja" ? "ja" : "en";

  return (
    <LegalPageLayout
      variant="web"
      title="LAW"
      description={tokushohoLead(lang)}
      updatedAt={TOKUSHOHO_UPDATED_AT}
    >
      <TokushohoDocument language={lang} />
    </LegalPageLayout>
  );
}
