// app/web/(no-nav)/contact/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export default function WebContactPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";
  const updatedAt = "2026-03-23";

  return (
    <LegalPageLayout
      variant="web"
      title={isEn ? "Contact Us" : "お問い合わせ"}
      description={
        isEn
          ? "If you have any issues, requests, or would like to report abusive or rule-violating behavior, please contact us using this form."
          : "不具合の報告やご要望、迷惑行為の通報などがあれば、こちらのフォームから運営にご連絡ください。"
      }
      updatedAt={updatedAt}
    >
      <section className="space-y-3 text-xs text-slate-100/80 mb-5">
        <p>
          {isEn ? (
            <>
              If you would like to contact us directly by email, please reach out to{" "}
              <span className="text-sky-300 font-semibold">support@uniterz.app</span>.
            </>
          ) : (
            <>
              メールで直接お問い合わせいただく場合は{" "}
              <span className="text-sky-300 font-semibold">support@uniterz.app</span> までご連絡ください。
            </>
          )}
        </p>
      </section>

      <ContactForm variant="web" />
    </LegalPageLayout>
  );
}
