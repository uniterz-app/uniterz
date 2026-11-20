import { ActivityIndicator, StyleSheet, View } from "react-native";
import { getNbaTeamNicknameById } from "../../../../../../lib/nba-team-names";
import { usePlayerStatLeadersBundle } from "../../../../../../lib/nba/usePlayerStatLeadersBundle";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import {
  formatPlayerLeaderValue,
  getPlayerLeaderTeamAbbr,
  playerLeaderMetricDef,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
} from "../../../../../../lib/predict/nbaPlayerStatLeadersMocks";
import { formatShotPerGame, nbaShotPctParts } from "../../../../../../lib/nba/playerStatLeaders/shotPctParts";
import {
  formatMetricValue,
  leagueMetricDef,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
} from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { HubCellHeader, HubRow } from "../leagueHub/leagueHubUiNative";

type Props = {
  scope: "player" | "team";
  metric: string;
  count?: number;
  /** このチームの行を強調（チームは前後 2 チームも出す） */
  team?: string;
  worst?: boolean;
  onSelectPlayer?: (playerId: string) => void;
  onSelectTeam?: (teamId: string) => void;
};

/** STATS 画面と同じ今季のリーダー / チームリーグ表の並びを、聞かれた指標だけ */
export default function AskLeagueLeadersNative(props: Props) {
  return props.scope === "player" ? <PlayerLeaders {...props} /> : <TeamLeaders {...props} />;
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color="#00F5FF" />
    </View>
  );
}

function PlayerLeaders({ metric, count = 5, team, onSelectPlayer }: Props) {
  const { bundle, loading } = usePlayerStatLeadersBundle({ apiBaseUrl: getUniterzApiBaseUrl() });
  const id = metric as NbaPlayerLeaderMetricId;
  let short: string;
  try {
    short = playerLeaderMetricDef(id).short;
  } catch {
    return null;
  }
  const all = bundle.season[id] ?? [];
  if (all.length === 0) return loading ? <Loading /> : null;
  const top = all.slice(0, count).map((row, i) => ({ row, rank: i + 1 }));
  const mineAt = team ? all.findIndex((row) => row.teamId === team) : -1;
  const rows = mineAt >= count ? [...top, { row: all[mineAt]!, rank: mineAt + 1 }] : top;
  const shot = nbaShotPctParts(id);
  /** 行に成功数 / 試投数が無い古いスナップショットは 3PM / 3PA などのボード（上位 30）から拾う */
  const fromBoard = (metricId: string | undefined, playerId: string) =>
    metricId ? bundle.season[metricId as NbaPlayerLeaderMetricId]?.find((r) => r.playerId === playerId)?.value : undefined;
  const shotCells = (row: NbaPlayerStatLeaderRow) =>
    shot
      ? [
          formatShotPerGame(row.made ?? fromBoard(shot.made, row.playerId)),
          formatShotPerGame(row.att ?? fromBoard(shot.att, row.playerId)),
        ]
      : [];
  return (
    <View>
      <HubCellHeader labels={shot ? [short, shot.madeShort, shot.attShort] : [short]} framed />
      {rows.map(({ row, rank }) => (
        <HubRow
          key={row.playerId}
          rank={rank}
          teamId={row.teamId}
          name={row.playerName}
          sub={getPlayerLeaderTeamAbbr(row.teamId)}
          {...(shot
            ? { cells: [formatPlayerLeaderValue(id, row.value).replace(/%$/, ""), ...shotCells(row)] }
            : { value: formatPlayerLeaderValue(id, row.value) })}
          highlight={Boolean(team) && row.teamId === team}
          onPress={onSelectPlayer ? () => onSelectPlayer(row.playerId) : undefined}
          framed
        />
      ))}
    </View>
  );
}

function TeamLeaders({ metric, count = 5, team, worst, onSelectTeam }: Props) {
  const { bundle, loading } = useLeagueTeamStatsBundle({ apiBaseUrl: getUniterzApiBaseUrl() });
  const id = metric as NbaLeagueTeamStatMetric;
  let def: ReturnType<typeof leagueMetricDef>;
  try {
    def = leagueMetricDef(id);
  } catch {
    return null;
  }
  if (loading && bundle.season.length === 0) return <Loading />;
  const valueOf = (row: NbaLeagueTeamStatRow) => (row as unknown as Record<string, unknown>)[id];
  const ranked = bundle.season
    .filter((row) => typeof valueOf(row) === "number")
    .sort((a, b) => (Number(valueOf(b)) - Number(valueOf(a))) * (def.higherIsBetter ? 1 : -1));
  if (ranked.length === 0) return null;
  const at = team ? ranked.findIndex((row) => row.teamId === team) : -1;
  const from = at >= 0 ? Math.max(0, Math.min(at - 2, ranked.length - 5)) : worst ? Math.max(0, ranked.length - count) : 0;
  const slice = ranked.slice(from, at >= 0 ? from + 5 : from + count).map((row, i) => ({ row, rank: from + i + 1 }));
  const rows = worst && at < 0 ? slice.reverse() : slice;
  return (
    <View>
      <HubCellHeader labels={[def.short]} framed />
      {rows.map(({ row, rank }) => (
        <HubRow
          key={row.teamId}
          rank={rank}
          teamId={row.teamId}
          name={getNbaTeamNicknameById(row.teamId).toUpperCase()}
          kind="team"
          value={formatMetricValue(id, Number(valueOf(row)))}
          highlight={row.teamId === team}
          onPress={onSelectTeam ? () => onSelectTeam(row.teamId) : undefined}
          framed
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 24, alignItems: "center" },
});
