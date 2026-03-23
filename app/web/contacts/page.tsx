// app/web/(with-nav)/contact/page.tsx
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";

export default function WebContactPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="お問い合わせ"
      description="不具合の報告やご要望、迷惑行為の通報などがあれば、こちらのフォームから運営にご連絡ください。"
      updatedAt="2025-11-17"
    >
      <section className="space-y-4 text-sm md:text-base text-slate-100/80 mb-6">
        <p>
  メールで直接お問い合わせいただく場合は  
  <span className="text-sky-300 font-semibold">support@uniterz.app</span>  
  までご連絡ください。
</p>
      </section>

      <ContactForm variant="web" />
    </LegalPageLayout>
  );
}
