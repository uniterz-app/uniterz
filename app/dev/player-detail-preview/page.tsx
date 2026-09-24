"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaPlayerDetailPanel from "@/app/component/playerDetail/NbaPlayerDetailPanel";

/** Luka — shot zones / 契約など詳細切片の確認用デフォルト */
const DEFAULT_DEV_PLAYER_ID = "132";

function Inner() {
  const sp = useSearchParams();
  const playerId = sp.get("playerId")?.trim() || DEFAULT_DEV_PLAYER_ID;
  return (
    <MobilePageShell
      title="Player Detail"
      eyebrow="DEV"
      subtitle="Season · game logs · contract · shot chart · mock"
    >
      <NbaPlayerDetailPanel playerId={playerId} useDevMock />
    </MobilePageShell>
  );
}

/**
 * /dev/player-detail-preview?playerId=
 * `playerId` 省略時は Luka (132)。Firestore 空でもシードモックで SHOT CHART 可。
 * 本番経路は `/mobile/player-detail-preview`（モックなし）。
 */
export default function DevPlayerDetailPreviewPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
