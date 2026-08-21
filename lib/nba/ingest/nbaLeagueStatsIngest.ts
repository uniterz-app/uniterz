/**
 * NBA リーグ表スナップショット ingest の差し込み口。
 *
 * クライアント / Native は BallDontLie を叩かない。
 * 契約後（ゲート B）はここから `nbaLeagueTeamStats` と `nbaLeaguePlayerStats` を書く。
 * STANDING は Firestore `nbaStandings/{season}`。ingest が書き、画面はそれを読む。
 * いまは seed スクリプトがモックを同じ writer に流すだけ。
 * 残件リスト: `docs/preview-to-prod-checklist.md` §5 ゲート B。
 */
export const NBA_LEAGUE_STATS_INGEST_READY = false;

export type NbaLeagueStatsIngestInput = {
  seasonKey: string;
};

export async function ingestNbaLeagueStatsFromProvider(
  _input: NbaLeagueStatsIngestInput
): Promise<never> {
  throw new Error(
    "NBA league stats ingest is not connected (gate B / API contract)"
  );
}
