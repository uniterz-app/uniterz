"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import TokushohoDocument from "@/app/component/legal/TokushohoDocument";
import {
  TOKUSHOHO_LEAD,
  TOKUSHOHO_UPDATED_AT,
} from "@/lib/legal/tokushohoCopy";

export default function WebLawPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="LAW"
      description={TOKUSHOHO_LEAD}
      updatedAt={TOKUSHOHO_UPDATED_AT}
    >
      <TokushohoDocument />
    </LegalPageLayout>
  );
}
