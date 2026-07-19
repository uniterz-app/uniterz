"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import RankGapView from "@/app/component/rankings/gap/RankGapView";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useRankingSessionUser } from "@/lib/rankings/useRankingSessionUser";
import { useRankGapAnalysis } from "@/lib/rankings/useRankGapAnalysis";
import { isRankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
} from "@/lib/navigation/rankingsProfileFrom";

export default function RankGapPageShell({
  layout = "mobile",
}: {
  layout?: "mobile" | "web";
}) {
  const searchParams = useSearchParams();
  const { fUser } = useFirebaseUser();
  const { user: sessionUser } = useRankingSessionUser(fUser?.uid);

  const rankingLeague = useMemo(() => {
    const raw = searchParams.get(RANKINGS_TAB_LEAGUE_PARAM);
    return isRankingLeagueSource(raw) ? raw : "worldcup";
  }, [searchParams]);

  const wcStage = useMemo(() => {
    const raw = searchParams.get(RANKINGS_TAB_WC_STAGE_PARAM);
    if (isWcRankingStage(raw)) return raw;
    return rankingLeague === "worldcup" ? "main" : null;
  }, [rankingLeague, searchParams]);

  const { analysis, loading, errorCode, reload } = useRankGapAnalysis({
    enabled: !!fUser?.uid && sessionUser.plan === "pro",
    rankingLeague,
    wcStage,
    language: sessionUser.language,
  });

  return (
    <div
      className={
        layout === "web"
          ? "mx-auto min-h-screen max-w-3xl px-2 pb-12 pt-4"
          : "min-h-screen px-1 pb-12 pt-2"
      }
    >
      <FloatingCloseButton />
      <RankGapView
        analysis={analysis}
        loading={loading || !fUser}
        errorCode={
          sessionUser.plan !== "pro" && fUser ? "pro_required" : errorCode
        }
        language={sessionUser.language}
        layout={layout}
        onRetry={() => void reload()}
      />
    </div>
  );
}
