// app/web/(with-nav)/contacts/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";
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
      title={m.support.contactTitle}
      description={m.support.contactDescription}
      updatedAt={updatedAt}
    >
      <section className="space-y-4 text-sm md:text-base text-slate-100/80 mb-6">
        <p>
          {m.support.contactEmailBefore}{" "}
          <span className="text-sky-300 font-semibold">support@uniterz.app</span>{m.support.contactEmailAfter}
        </p>
      </section>

      <ContactForm variant="web" />
    </LegalPageLayout>
  );
}
