import type {
  SummaryForCardsV2,
  SummaryRanksV2,
} from "@/app/component/profile/useUserStatsV2";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { WcKinetikStackedStage } from "@/lib/profile/profileKinetikMetricsSection";

export type ProfileKinetikPhaseResult = {
  summary: SummaryForCardsV2 | null;
  summaryRanks: SummaryRanksV2 | null;
  metricValueDeltas: MyRankMetricValueDeltas | null;
};

export async function fetchProfileKinetikPhase(
  uid: string,
  wcStage: WcKinetikStackedStage,
  apiBase?: string
): Promise<ProfileKinetikPhaseResult> {
  const qs = new URLSearchParams({
    uid,
    parts: "phase",
    phase: "playoffs",
    league: "worldcup",
    wcStage,
  });
  const path = `/api/profile/user-stats?${qs.toString()}`;
  const url = apiBase ? `${apiBase.replace(/\/$/, "")}${path}` : path;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? "failed to fetch profile stats");
  }
  return {
    summary: (json?.summary as SummaryForCardsV2) ?? null,
    summaryRanks: (json?.summaryRanks as SummaryRanksV2 | null | undefined) ?? null,
    metricValueDeltas:
      (json?.metricValueDeltas as MyRankMetricValueDeltas | null | undefined) ??
      null,
  };
}
