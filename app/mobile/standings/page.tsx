"use client";

import NbaStandingsPanel from "@/app/component/standings/NbaStandingsPanel";

export default function MobileStandingsPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-bottom-nav pt-4 text-white">
      <h1 className="mb-4 text-lg font-semibold tracking-wide text-white/90">
        スタンディング
      </h1>
      <NbaStandingsPanel />
    </main>
  );
}
