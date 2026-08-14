/** STATS ハブと同じチーム詳細（`NbaTeamDetailPanel`） */
export function nbaTeamDetailPreviewHref(teamId: string): string {
  return `/mobile/team-detail-preview?teamId=${encodeURIComponent(teamId)}`;
}
