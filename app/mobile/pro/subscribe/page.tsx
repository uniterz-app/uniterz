"use client";

import { useCallback, useState } from "react";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
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
  const backAria =
    prefersSideMenuAria && fUser ? m.common.backToSideMenu : m.common.back;
  const [edgeBack, setEdgeBack] = useState(true);
  const onTrialSuccessChange = useCallback((active: boolean) => {
    setEdgeBack(!active);
  }, []);

  return (
    <CyberSubpageShell
      eyebrow="PRO"
      title="GET PRO"
      onBack={goBack}
      backAriaLabel={backAria}
      edgeBack={edgeBack}
      hideBack
      contentClassName="mx-auto max-w-xl px-3 py-4 sm:px-4"
    >
      <ProSubscribePreview
        language={language}
        className="flex min-h-0 flex-1 flex-col"
        onTrialSuccessChange={onTrialSuccessChange}
      />
    </CyberSubpageShell>
  );
}
