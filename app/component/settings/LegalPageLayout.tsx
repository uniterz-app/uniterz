"use client";

import React from "react";
import cn from "clsx";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";
import { ChevronLeft } from "lucide-react";

type Variant = "web" | "mobile";

type Props = {
  variant: Variant;
  title: string;
  description?: string;
  updatedAt?: string;
  children: React.ReactNode;
};

export default function LegalPageLayout({
  variant,
  title,
  description,
  updatedAt,
  children,
}: Props) {
  const isWeb = variant === "web";
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const { goBack, prefersSideMenuAria } = useFloatingBackNavigation();
  const backAria =
    prefersSideMenuAria && user ? m.common.backToSideMenu : m.common.back;

  return (
    <div className="min-h-screen w-full">
      <button
        type="button"
        onClick={goBack}
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-zinc-900/80 text-white backdrop-blur-sm transition hover:bg-zinc-800/90 active:scale-95"
        aria-label={backAria}
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>

      <div
        className={cn(
          "mx-auto text-white",
          isWeb ? "max-w-2xl px-6 py-10" : "max-w-[640px] px-5 py-8",
        )}
      >
        <header className="mb-6">
          <h1 className="text-lg font-bold tracking-tight md:text-xl">
            {title}
          </h1>
          {updatedAt && (
            <p className="mt-1 text-xs text-white/40">
              {m.settings.lastUpdated}
              {updatedAt}
            </p>
          )}
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {description}
            </p>
          )}
        </header>

        <div className="space-y-5 text-sm leading-relaxed text-white/80">
          {children}
        </div>
      </div>
    </div>
  );
}
