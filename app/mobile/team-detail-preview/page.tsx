"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaTeamDetailPanel from "@/app/component/teamDetail/NbaTeamDetailPanel";
import type { NbaPredictToolsTabId } from "@/lib/predict/nbaTeamDetailHref";
import {
  isSafeFirestoreDocId,
} from "@/lib/predict/nbaTeamDetailHref";
import {
  consumePredictTeamDetailReturn,
  peekPredictTeamDetailReturn,
} from "@/lib/predict/predictTeamDetailReturn";

function parsePredictToolsTab(
  value: string | null | undefined
): NbaPredictToolsTabId | undefined {
  if (
    value === "insight" ||
    value === "injuries" ||
    value === "stats" ||
    value === "roster"
  ) {
    return value;
  }
  return undefined;
}

function shouldReturnToPredictOverlay(
  returnModeParam: string | null,
  fromPredict: string | null,
  stashedReturnMode: "overlay" | "route" | undefined
): boolean {
  if (returnModeParam === "overlay") return true;
  if (stashedReturnMode === "overlay") return true;
  return isSafeFirestoreDocId(fromPredict);
}

function Inner() {
  const sp = useSearchParams();
  const teamId = sp.get("teamId") ?? undefined;
  return <NbaTeamDetailPanel teamId={teamId} />;
}

function TeamDetailPreviewShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const fromPredict = sp.get("fromPredict");
  const predictTools = sp.get("predictTools");
  const returnModeParam = sp.get("returnMode");

  const goBackFromTeamDetail = () => {
    const stashed = peekPredictTeamDetailReturn();
    const gameId = isSafeFirestoreDocId(fromPredict)
      ? fromPredict
      : stashed?.gameId;
    const tab =
      parsePredictToolsTab(predictTools) ??
      stashed?.predictToolsTab ??
      "stats";
    const returnToOverlay = shouldReturnToPredictOverlay(
      returnModeParam,
      fromPredict,
      stashed?.returnMode
    );

    if (isSafeFirestoreDocId(gameId)) {
      consumePredictTeamDetailReturn();
      if (returnToOverlay) {
        router.push(
          `/mobile/games?openPredict=${encodeURIComponent(gameId)}&predictTools=${encodeURIComponent(tab)}`
        );
        return;
      }
      router.push(
        `/mobile/games/${gameId}/predict?predictTools=${encodeURIComponent(tab)}`
      );
      return;
    }
    consumePredictTeamDetailReturn();
    router.back();
  };

  return (
    <MobilePageShell
      title="Team Detail"
      eyebrow="PREVIEW"
      subtitle="再構築プレビュー · 指標リーグ順位つき"
      onClose={goBackFromTeamDetail}
    >
      <Inner />
    </MobilePageShell>
  );
}

/** Team Detail 叩き台（モック） */
export default function MobileTeamDetailPreviewPage() {
  return (
    <Suspense fallback={null}>
      <TeamDetailPreviewShell />
    </Suspense>
  );
}
