"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function WebFeatureRequestPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";
  const updatedAt = "2026-04-10";

  return (
    <LegalPageLayout
      variant="web"
      title="REQUEST"
      description={
        isEn
          ? "Share feature ideas and improvements you want to see in Uniterz."
          : "Uniterz で実装してほしい機能や改善案をお送りください。"
      }
      updatedAt={updatedAt}
    >
      <section className="mb-5 space-y-3 text-xs text-slate-100/80">
        <p>
          {isEn
            ? "Your request will be reviewed by the team."
            : "送信いただいた要望は運営チームで確認し、今後の改善に活用します。"}
        </p>
      </section>

      <ContactForm variant="web" initialType="feature" hideTypeSelect />
    </LegalPageLayout>
  );
}
