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
          内容によっては返信までお時間をいただく場合があります。また、すべてのお問い合わせに個別の回答をお約束するものではありません。
        </p>
        <p className="text-xs md:text-sm text-slate-300">
          緊急性の高い通報（迷惑行為・ルール違反など）は、できるだけ詳しい状況やユーザー名・試合名を記載してください。
        </p>
      </section>

      <ContactForm variant="web" />
    </LegalPageLayout>
  );
}
