"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaTeamDetailPanel from "@/app/component/teamDetail/NbaTeamDetailPanel";

function Inner() {
  const sp = useSearchParams();
  const teamId = sp.get("teamId") ?? undefined;
  return <NbaTeamDetailPanel teamId={teamId} />;
}

/** Team Detail 叩き台（モック） */
export default function MobileTeamDetailPreviewPage() {
  const router = useRouter();

  return (
    <Suspense fallback={null}>
      <MobilePageShell
        title="Team Detail"
        eyebrow="PREVIEW"
        subtitle="再構築プレビュー · 指標リーグ順位つき"
        onClose={() => router.back()}
      >
        <Inner />
      </MobilePageShell>
    </Suspense>
  );
}
