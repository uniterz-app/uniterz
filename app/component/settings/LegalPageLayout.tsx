"use client";

import React from "react";
import cn from "clsx";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";

type Variant = "web" | "mobile";

type Props = {
  variant: Variant;
  title: string;
  description?: string;
  updatedAt?: string;
  children: React.ReactNode;
  /** ヘッダー上段（既定 PROFILE） */
  eyebrow?: string;
};

export default function LegalPageLayout({
  variant,
  title,
  description,
  updatedAt,
  children,
  eyebrow = "PROFILE",
}: Props) {
  const isWeb = variant === "web";
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const { goBack, prefersSideMenuAria } = useFloatingBackNavigation();
  const backAria =
    prefersSideMenuAria && user ? m.common.backToSideMenu : m.common.back;

  const helpText = [description, updatedAt ? `${m.settings.lastUpdated}${updatedAt}` : null]
    .filter(Boolean)
    .join("\n");

  return (
    <CyberSubpageShell
      eyebrow={eyebrow}
      title={title}
      subtitle={helpText || undefined}
      onBack={goBack}
      backAriaLabel={backAria}
      contentClassName={cn(
        "text-white",
        isWeb ? "max-w-3xl px-6 py-10 md:px-8" : "max-w-[640px] px-5 py-8"
      )}
    >
      <div className="space-y-5 text-sm leading-relaxed text-white/80">
        {children}
      </div>
    </CyberSubpageShell>
  );
}
