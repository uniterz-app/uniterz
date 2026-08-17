"use client";

import ProSubscribePreview from "@/app/component/pro/dev/ProSubscribePreview";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";
import { t } from "@/lib/i18n/t";

export default function MobileProSubscribePage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const { goBack, prefersSideMenuAria } = useFloatingBackNavigation();
  const m = t(language);
  const ja = language === "ja";
  const backAria =
    prefersSideMenuAria && fUser ? m.common.backToSideMenu : m.common.back;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col px-3 py-4 pb-bottom-nav text-white sm:px-4">
      <ProSubscribePreview
        language={language}
        className="flex min-h-0 flex-1 flex-col"
        onBack={goBack}
        backAriaLabel={backAria}
        helpText={
          ja
            ? "スキンやプレミアム機能を使える Pro プランです。"
            : "Upgrade to Pro for skins and premium features."
        }
      />
    </main>
  );
}
