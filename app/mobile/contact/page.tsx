// app/mobile/(no-nav)/contact/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";
import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

export default function MobileContactPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const updatedAt = "2026-03-23";

  return (
    <LegalPageLayout
      variant="mobile"
      title="CONTACT"
      description={m.support.contactDescription}
      updatedAt={updatedAt}
    >
      <section className="mb-5 space-y-3 text-xs text-white/75">
        <p>
          {m.support.contactEmailBefore}{" "}
          <span className="font-semibold text-white">{SUPPORT_EMAIL}</span>
          {m.support.contactEmailAfter}
        </p>
      </section>

      <ContactForm variant="mobile" />
    </LegalPageLayout>
  );
}
