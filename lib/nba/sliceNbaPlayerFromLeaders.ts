/**
 * 詳細ページはリーグ表スナップショットから切る。試合 doc に 30 チーム分は保存しない。
 */
import type { NbaPlayerSeasonMetricId } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerDetailPreview } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import { isPlayerAdvancedLeaderMetric } from "@/lib/predict/nbaPlayerStatLeadersMocks";

const SEASON_TO_LEADER: Partial<
  Record<NbaPlayerSeasonMetricId, NbaPlayerLeaderMetricId>
> = {
  pts: "pts",
  reb: "reb",
  ast: "ast",
  stl: "stl",
  blk: "blk",
  tov: "tov",
  min: "min",
  fg_pct: "fg_pct",
  fga: "fga",
  fg3_pct: "fg3_pct",
  fg3m: "fg3m",
  fg3a: "fg3a",
  ft_pct: "ft_pct",
};

export function rankInPlayerLeaders(
  bundle: NbaPlayerStatLeadersBundle,
  metric: NbaPlayerLeaderMetricId,
  playerId: string,
  window: "season" | "last10" = "season"
): number | null {
  const rows = bundle[window][metric] ?? [];
  const idx = rows.findIndex((r) => r.playerId === playerId);
  return idx >= 0 ? idx + 1 : null;
}

/** 詳細の順位・値をリーダー表から上書き。名簿・ログは詳細モックのまま。 */
export function overlayPlayerDetailWithLeaders(
  detail: NbaPlayerDetailPreview,
  leaders: NbaPlayerStatLeadersBundle
): NbaPlayerDetailPreview {
  const seasonMetrics = detail.seasonMetrics.map((m) => {
    const leaderId = SEASON_TO_LEADER[m.id];
    if (!leaderId) return m;
    const rank = rankInPlayerLeaders(leaders, leaderId, detail.playerId);
    if (rank == null) return m;
    return { ...m, leagueRank: rank };
  });

  const headlineMetrics = detail.headlineMetrics.map((m) => {
    const hit = seasonMetrics.find((x) => x.id === m.id);
    return hit ?? m;
  });

  const advancedMetrics = detail.advancedMetrics.map((m) => {
    if (!isPlayerAdvancedLeaderMetric(m.id)) return m;
    const rank = rankInPlayerLeaders(leaders, m.id, detail.playerId);
    if (rank == null) return m;
    return { ...m, leagueRank: rank };
  });

  return {
    ...detail,
    asOfLabel: leaders.asOfLabel || detail.asOfLabel,
    seasonMetrics,
    headlineMetrics,
    advancedMetrics,
  };
}
