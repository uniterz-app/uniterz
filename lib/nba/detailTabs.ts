/**
 * チーム詳細 / プレイヤー詳細のタブ分割（Web / Native 共通）。
 * 1 本の長いスクロールを、予想に使う情報（OVERVIEW）とたまに見る情報に分ける。
 */

export const NBA_TEAM_DETAIL_TABS = ["overview", "games", "roster", "office"] as const;
export type NbaTeamDetailTab = (typeof NBA_TEAM_DETAIL_TABS)[number];

export const NBA_PLAYER_DETAIL_TABS = ["overview", "games", "career", "contract"] as const;
export type NbaPlayerDetailTab = (typeof NBA_PLAYER_DETAIL_TABS)[number];

const TAB_LABELS: Record<NbaTeamDetailTab | NbaPlayerDetailTab, string> = {
  overview: "OVERVIEW",
  games: "GAMES",
  roster: "ROSTER",
  office: "OFFICE",
  career: "CAREER",
  contract: "CONTRACT",
};

export function nbaDetailTabLabel(tab: NbaTeamDetailTab | NbaPlayerDetailTab): string {
  return TAB_LABELS[tab];
}
