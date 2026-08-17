"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NbaPlayerDetailPanel from "@/app/component/playerDetail/NbaPlayerDetailPanel";

function Inner() {
  const sp = useSearchParams();
  const playerId = sp.get("playerId") ?? undefined;
  return <NbaPlayerDetailPanel playerId={playerId} />;
}

/** Player Detail 叩き台（モック） */
export default function MobilePlayerDetailPreviewPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-bottom-nav pt-4 text-white">
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </main>
  );
}
