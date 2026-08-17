"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaPlayerDetailPanel from "@/app/component/playerDetail/NbaPlayerDetailPanel";

function Inner() {
  const sp = useSearchParams();
  const playerId = sp.get("playerId") ?? undefined;
  return <NbaPlayerDetailPanel playerId={playerId} />;
}

/** Player Detail 叩き台（モック） */
export default function MobilePlayerDetailPreviewPage() {
  const router = useRouter();

  return (
    <Suspense fallback={null}>
      <MobilePageShell
        title="Player Detail"
        eyebrow="PREVIEW"
        subtitle="叩き台 · シーズン / 試合ログ / 契約"
        onClose={() => router.back()}
      >
        <Inner />
      </MobilePageShell>
    </Suspense>
  );
}
