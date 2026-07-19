"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import RankGapView from "@/app/component/rankings/gap/RankGapView";
import RankIntelTabBar from "@/app/component/rankings/gap/RankIntelTabBar";
import RankShadowView from "@/app/component/rankings/gap/RankShadowView";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useRankingSessionUser } from "@/lib/rankings/useRankingSessionUser";
import { useRankGapAnalysis } from "@/lib/rankings/useRankGapAnalysis";
import { useRankShadowAnalysis } from "@/lib/rankings/useRankShadowAnalysis";
import { isRankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  RANKINGS_TAB_LEAGUE_PARAM,
  RANKINGS_TAB_WC_STAGE_PARAM,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  isRankIntelTab,
  RANK_INTEL_TAB_PARAM,
  type RankIntelTab,
} from "@/lib/navigation/rankIntelTab";
import { t } from "@/lib/i18n/t";

export default function RankIntelPageShell({
  layout = "mobile",
}: {
  layout?: "mobile" | "web";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fUser } = useFirebaseUser();
  const { user: sessionUser } = useRankingSessionUser(fUser?.uid);
  const m = t(sessionUser.language);

  const activeTab: RankIntelTab = useMemo(() => {
    const raw = searchParams.get(RANK_INTEL_TAB_PARAM);
    return isRankIntelTab(raw) ? raw : "gap";
  }, [searchParams]);

  const rankingLeague = useMemo(() => {
    const raw = searchParams.get(RANKINGS_TAB_LEAGUE_PARAM);
    return isRankingLeagueSource(raw) ? raw : "worldcup";
  }, [searchParams]);

  const wcStage = useMemo(() => {
    const raw = searchParams.get(RANKINGS_TAB_WC_STAGE_PARAM);
    if (isWcRankingStage(raw)) return raw;
    return rankingLeague === "worldcup" ? "main" : null;
  }, [rankingLeague, searchParams]);

  const isPro = sessionUser.plan === "pro";
  const enabled = !!fUser?.uid && isPro;

  const gap = useRankGapAnalysis({
    enabled: enabled && activeTab === "gap",
    rankingLeague,
    wcStage,
    language: sessionUser.language,
  });

  const shadow = useRankShadowAnalysis({
    enabled: enabled && activeTab === "shadow",
    rankingLeague,
    wcStage,
    language: sessionUser.language,
  });

  const setActiveTab = useCallback(
    (tab: RankIntelTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(RANK_INTEL_TAB_PARAM, tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const proError = !isPro && fUser ? "pro_required" : null;

  return (
    <div
      className={
        layout === "web"
          ? "mx-auto min-h-screen max-w-3xl px-2 pb-12 pt-4"
          : "min-h-screen px-1 pb-12 pt-2"
      }
    >
      <FloatingCloseButton />
      <RankIntelTabBar
        active={activeTab}
        gapLabel={m.rankings.rankIntel.tabGap}
        shadowLabel={m.rankings.rankIntel.tabShadow}
        onChange={setActiveTab}
      />

      {activeTab === "gap" ? (
        <RankGapView
          analysis={gap.analysis}
          loading={gap.loading || !fUser}
          errorCode={proError ?? gap.errorCode}
          language={sessionUser.language}
          layout={layout}
          onRetry={() => void gap.reload()}
        />
      ) : (
        <RankShadowView
          analysis={shadow.analysis}
          loading={shadow.loading || !fUser}
          errorCode={proError ?? shadow.errorCode}
          language={sessionUser.language}
          layout={layout}
          onRetry={() => void shadow.reload()}
        />
      )}
    </div>
  );
}
