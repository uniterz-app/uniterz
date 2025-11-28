// app/component/settings/LegalPageLayout.tsx
"use client";

import React from "react";
import cn from "clsx";
import Image from "next/image";

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

  return (
    <div className="min-h-screen w-full bg-[#0a3b47] relative">
      <div
        className={cn(
          "mx-auto text-white",
          isWeb ? "max-w-3xl px-6 py-10" : "max-w-[640px] px-4 py-8"
        )}
      >
        {/* カード */}
        <div className="rounded-3xl bg-[#072d37] px-6 py-6 shadow-lg border border-white/10">
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
                  最終更新日: {updatedAt}
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
        </div>
      </div>

      {/* ===== 戻る（×）ボタン：右下固定 ===== */}
      <button
        onClick={() => window.history.back()}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-white/10 backdrop-blur 
          border border-white/20 
          flex items-center justify-center
          shadow-[0_0_18px_rgba(0,0,0,0.35)]
          active:scale-95 transition-transform
        "
        aria-label="閉じる"
      >
        <span className="text-2xl font-bold text-white">×</span>
      </button>
    </div>
  );
}
