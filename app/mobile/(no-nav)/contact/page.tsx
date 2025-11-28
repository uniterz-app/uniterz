// app/mobile/(no-nav)/contact/page.tsx
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import ContactForm from "@/app/component/support/ContactForm";

export default function MobileContactPage() {
  return (
    <LegalPageLayout
      variant="mobile"
      title="お問い合わせ"
      description="不具合の報告やご要望、迷惑行為の通報などがあれば、こちらのフォームから運営にご連絡ください。"
      updatedAt="2025-11-17"
    >
      <section className="space-y-3 text-xs text-slate-100/80 mb-5">
        <p>
          内容によっては返信までお時間をいただく場合があります。
          追加で伝えたいことがあれば、同じフォームから複数回送信しても大丈夫です。
        </p>
      </section>

      <ContactForm variant="mobile" />
    </LegalPageLayout>
  );
}
