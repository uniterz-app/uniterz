"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NbaTeamDetailPanel from "@/app/component/teamDetail/NbaTeamDetailPanel";

function Inner() {
  const sp = useSearchParams();
  const teamId = sp.get("teamId") ?? undefined;
  return <NbaTeamDetailPanel teamId={teamId} />;
}

/** Team Detail 叩き台（モック） */
export default function MobileTeamDetailPreviewPage() {
  return (
    <main className="min-h-dvh bg-app px-4 pb-bottom-nav pt-4 text-white">
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </main>
  );
}
