// app/component/settings/LegalPageLayout.tsx
"use client";

import React from "react";
import cn from "clsx";
import Image from "next/image";
import SettingsNeonCard from "@/app/component/settings/SettingsNeonCard";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";
import { ChevronLeft } from "lucide-react";

type Variant = "web" | "mobile";

type Props = {
  variant: Variant;
  title: string;
  description: string;
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
    prefersSideMenuAria && user
      ? m.common.backToSideMenu
      : m.common.back;

  return (
    <div className="min-h-screen w-full bg-[#050814] relative">
      <div
        className={cn(
          "mx-auto text-white",
          isWeb ? "max-w-3xl px-6 py-10" : "max-w-[640px] px-4 py-8"
        )}
      >
        <SettingsNeonCard className="w-full">
          {/* ヘッダー */}
          <div className="mb-4 flex items-center gap-3">
            {/* ロゴ差し替え（U → ロゴ画像） */}
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 overflow-hidden">
              <Image
                src="/logo/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
                priority
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                {title}
              </h1>
              {updatedAt && (
                <p className="mt-1 text-xs text-white/60">
                  {m.settings.lastUpdated}
                  {updatedAt}
                </p>
              )}
            </div>
          </div>

          {/* 説明 */}
          <p className="mb-4 text-sm md:text-base text-white/80 leading-relaxed">
            {description}
          </p>

          {/* 本文 */}
          <div className="mt-4 space-y-4 text-xs md:text-sm leading-relaxed text-white/80">
            {children}
          </div>
        </SettingsNeonCard>
      </div>

      {/* ===== 戻る：右上固定 ===== */}
      <button
        type="button"
        onClick={goBack}
        className="
          fixed top-4 right-4 z-50
          flex h-11 w-11 items-center justify-center rounded-full
          border border-white/20 bg-zinc-900/85 text-white backdrop-blur-sm
          shadow-[0_8px_18px_rgba(0,0,0,0.4)]
          transition hover:bg-zinc-800/90 active:scale-95
        "
        aria-label={backAria}
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}
