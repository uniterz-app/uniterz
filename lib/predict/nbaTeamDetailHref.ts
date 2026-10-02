export type NbaPredictToolsTabId =
  | "insight"
  | "injuries"
  | "stats"
  | "roster";

export function parseNbaPredictToolsTab(
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

export function isSafeFirestoreDocId(
  id: string | null | undefined
): id is string {
  return id != null && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

type TeamDetailPreviewOpts = {
  /** 予想入力から開いたときの games/{id} */
  fromPredict?: string;
  /** 戻ったときに開く NBA 予想ツールタブ */
  predictToolsTab?: NbaPredictToolsTabId;
};

/** STATS ハブと同じチーム詳細（`NbaTeamDetailPanel`） */
export function nbaTeamDetailPreviewHref(
  teamId: string,
  opts?: TeamDetailPreviewOpts
): string {
  const params = new URLSearchParams({
    teamId,
  });
  if (opts?.fromPredict) {
    params.set("fromPredict", opts.fromPredict);
    params.set("returnMode", "overlay");
  }
  if (opts?.predictToolsTab) {
    params.set("predictTools", opts.predictToolsTab);
  }
  return `/mobile/team-detail-preview?${params.toString()}`;
}

/** STATS ハブと同じ選手詳細（`NbaPlayerDetailPanel`） */
export function nbaPlayerDetailPreviewHref(
  playerId: string,
  opts?: TeamDetailPreviewOpts
): string {
  const params = new URLSearchParams({
    playerId,
  });
  if (opts?.fromPredict) {
    params.set("fromPredict", opts.fromPredict);
    params.set("returnMode", "overlay");
  }
  if (opts?.predictToolsTab) {
    params.set("predictTools", opts.predictToolsTab);
  }
  return `/mobile/player-detail-preview?${params.toString()}`;
}

/** チーム詳細プレビューから予想入力へ戻る URL */
export function predictPageHrefFromTeamDetail(
  gameId: string,
  opts?: { predictToolsTab?: NbaPredictToolsTabId }
): string {
  if (opts?.predictToolsTab) {
    return `/mobile/games/${gameId}/predict?predictTools=${encodeURIComponent(opts.predictToolsTab)}`;
  }
  return `/mobile/games/${gameId}/predict`;
}
