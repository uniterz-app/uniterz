// app/web/(with-nav)/contacts/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";
import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

export default function WebContactPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const updatedAt = "2026-03-23";

  return (
    <LegalPageLayout
      variant="web"
      title="CONTACT"
      description={m.support.contactDescription}
      updatedAt={updatedAt}
    >
      <section className="mb-6 space-y-4 text-sm text-white/75 md:text-base">
        <p>
          {m.support.contactEmailBefore}{" "}
          <span className="font-semibold text-white">{SUPPORT_EMAIL}</span>
          {m.support.contactEmailAfter}
        </p>
      </section>

      <ContactForm variant="web" />
    </LegalPageLayout>
  );
}
