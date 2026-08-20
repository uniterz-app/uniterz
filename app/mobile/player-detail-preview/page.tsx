"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaPlayerDetailPanel from "@/app/component/playerDetail/NbaPlayerDetailPanel";
import {
  isSafeFirestoreDocId,
  parseNbaPredictToolsTab,
} from "@/lib/predict/nbaTeamDetailHref";
import {
  consumePredictTeamDetailReturn,
  peekPredictTeamDetailReturn,
} from "@/lib/predict/predictTeamDetailReturn";

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
  const playerId = sp.get("playerId") ?? undefined;
  return <NbaPlayerDetailPanel playerId={playerId} />;
}

function PlayerDetailPreviewShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const fromPredict = sp.get("fromPredict");
  const predictTools = sp.get("predictTools");
  const returnModeParam = sp.get("returnMode");

  const goBackFromPlayerDetail = () => {
    /** チーム詳細経由の選手は stash を触らない（チームへ back してから予想へ戻す） */
    const openedFromPredict =
      isSafeFirestoreDocId(fromPredict) ||
      returnModeParam === "overlay" ||
      returnModeParam === "route";
    if (!openedFromPredict) {
      router.back();
      return;
    }

    const stashed = peekPredictTeamDetailReturn();
    const gameId = isSafeFirestoreDocId(fromPredict)
      ? fromPredict
      : stashed?.gameId;
    const tab =
      parseNbaPredictToolsTab(predictTools) ??
      stashed?.predictToolsTab ??
      "roster";
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
      title="Player Detail"
      eyebrow="PREVIEW"
      subtitle="叩き台 · シーズン / 試合ログ / 契約"
      onClose={goBackFromPlayerDetail}
    >
      <Inner />
    </MobilePageShell>
  );
}

/** Player Detail 叩き台（モック） */
export default function MobilePlayerDetailPreviewPage() {
  return (
    <Suspense fallback={null}>
      <PlayerDetailPreviewShell />
    </Suspense>
  );
}
