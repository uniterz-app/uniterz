"use client";

import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import ProSubscribePreview from "@/app/component/pro/dev/ProSubscribePreview";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function WebProSubscribePage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-8 text-white md:px-8">
      <FloatingCloseButton />
      <div className="mx-auto max-w-4xl">
        <ProSubscribePreview language={language} />
      </div>
    </main>
  );
}
