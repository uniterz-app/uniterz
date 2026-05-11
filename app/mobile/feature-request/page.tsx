"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { useRouter } from "next/navigation";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";

export default function MobileFeatureRequestPage() {
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const isEn = language === "en";
  const updatedAt = "2026-04-10";

  return (
    <>
      <FloatingCloseButton />
      <LegalPageLayout
        variant="mobile"
        title={m.settings.featureRequestTitle}
        description={
          isEn
            ? "Share feature ideas and improvements you want to see in Uniterz."
            : "Uniterz で実装してほしい機能や改善案をお送りください。"
        }
        updatedAt={updatedAt}
      >
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10"
          >
            {m.common.back}
          </button>
        </div>

        <section className="space-y-3 text-xs text-slate-100/80 mb-5">
          <p>
            {isEn
              ? "Your request will be reviewed by the team."
              : "送信いただいた要望は運営チームで確認し、今後の改善に活用します。"}
          </p>
        </section>

        <ContactForm variant="mobile" initialType="feature" hideTypeSelect />
      </LegalPageLayout>
    </>
  );
}
