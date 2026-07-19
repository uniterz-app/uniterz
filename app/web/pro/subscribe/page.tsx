"use client";

import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import ProSubscribePreview from "@/app/component/pro/dev/ProSubscribePreview";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function WebProSubscribePage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);

  return (
    <main className="min-h-screen bg-[#050b14] px-3 py-6 text-white sm:px-4">
      <FloatingCloseButton />
      <div className="mx-auto max-w-xl">
        <ProSubscribePreview language={language} />
      </div>
    </main>
  );
}
