// app/component/pro/ProLanding.tsx
"use client";

import type React from "react";
import ProMainCard from "./ProMainCard";
import MyStatsSection from "./MyStatsSection";
import MarketProSection from "./MarketProSection";

type ProLandingProps = {
  variant?: "full" | "embedded";
};

export default function ProLanding({ variant = "full" }: ProLandingProps) {
  const Wrapper: React.ComponentType<{ children: React.ReactNode }> =
    variant === "full"
      ? ({ children }) => (
          <main className="min-h-screen bg-gradient-to-b from-[#030816] via-[#05091e] to-[#020308] text-white">
            <div className="mx-auto max-w-6xl px-4 pt-10 pb-20">{children}</div>
          </main>
        )
      : ({ children }) => (
          <div className="px-4 py-4 text-white sm:px-0 sm:py-6">{children}</div>
        );

  return (
    <Wrapper>
      <section>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          {/* 左カラム：Proカード */}
          <div className="lg:w-[340px] lg:shrink-0">
            <ProMainCard />
          </div>

          {/* 右カラム：My Stats Pro ＋ Market Pro を縦に */}
          <div className="flex-1 space-y-12">
            <MyStatsSection />
            <MarketProSection />
          </div>
        </div>
      </section>
    </Wrapper>
  );
}
