import { useMemo, type ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { NbaAskView } from "../../../../../../lib/nba/ask/nbaAskBoard";
import type { NbaAskHowGroup, NbaAskHowTab } from "../../../../../../lib/nba/ask/nbaAskHowTheyPlay";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { getTeamUiAccentColor } from "../../../../../../lib/team-colors";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { usePlayerStatLeadersBundle } from "../../../../../../lib/nba/usePlayerStatLeadersBundle";
import { useNbaTeamDetailLiveOverlay } from "../../../../../../lib/nba/teamDetail/useNbaTeamDetailLiveOverlay";
import { useNbaPlayerDetailLiveOverlay } from "../../../../../../lib/nba/playerDetail/useNbaPlayerDetailLiveOverlay";
import { getNbaTeamDetailPreview } from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import { getNbaPlayerDetailPreview } from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { NbaTeamDisciplineSectionNative, NbaPlayerDisciplineSectionNative } from "../NbaDisciplineSectionNative";
import { NbaTeamRosterCardNative } from "../predict/NbaRosterPanelNative";
import NbaTeamLineupsNative from "../teamDetail/NbaTeamLineupsNative";
import NbaTeamOnOffNative from "../teamDetail/NbaTeamOnOffNative";
import { NbaTeamPositionDefenseNative } from "../teamDetail/NbaTeamPositionDefenseNative";
import { NbaTeamStatSplitTableNative } from "../teamDetail/NbaTeamStatSplitTableNative";
import { nbaTeamDetailUiCopy } from "../teamDetail/nbaTeamDetailUiCopy";
import NbaPlayerOnOffNative from "../playerDetail/NbaPlayerOnOffNative";
import NbaPlayerMatchupsNative from "../playerDetail/NbaPlayerMatchupsNative";
import { NbaPlayerGameLogTableNative } from "../playerDetail/NbaPlayerGameLogTableNative";
import { NbaPlayerHighsAndHitRatesNative } from "../playerDetail/NbaPlayerGameInsightsNative";
import { NbaPlayerSeasonAveragesNative } from "../playerDetail/NbaPlayerSeasonAveragesNative";
import NbaPlayerHowTheyPlayNative from "../playerDetail/NbaPlayerHowTheyPlayNative";
import NbaTeamHowTheyPlayNative from "../teamDetail/NbaTeamHowTheyPlayNative";
import {
  DraftPicksSection,
  GameLogsSection,
  InjuriesSection,
  PayrollSection,
  RecentFormSection,
  TeamShapeEdgesSectionNative,
} from "../teamDetail/NbaTeamDetailPanelNative";
import {
  PlayerContractSection,
  PlayerGameSplitsSectionNative,
  PlayerIdCard,
  PlayerMoreSection,
  SeasonHistorySection,
  ShotZoneHeatmap,
} from "../playerDetail/NbaPlayerDetailPanelNative";
import { NbaStandingsTablesNative } from "../standings/NbaLeagueStandingsPanelNative";
import {
  HubHotColdSection,
  HubSeasonHighsSection,
  HubTopGamesSection,
  LeagueHubAwardLadderNative,
} from "../leagueHub/LeagueHubPlayerPanelNative";
import {
  MilestonesSection,
  PlayerSplitsSection,
  ValueSection,
  type SplitMode,
  type ValueMode,
} from "../leagueHub/LeagueHubPlayerExtrasNative";
import { ScheduleStrength, TeamRecords, UniterzPicks, type RecordMode } from "../leagueHub/LeagueHubTeamPanelNative";
import { LeagueHubOnOffBestNative } from "../leagueHub/LeagueHubBestNative";
import { HubSection } from "../leagueHub/leagueHubUiNative";
import type { LeagueHubHighStat } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { useNbaLeagueHubNative } from "../leagueHub/useNbaLeagueHubNative";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import AskDailyLeadersNative from "./AskDailyLeadersNative";
import AskLeagueLeadersNative from "./AskLeagueLeadersNative";

type Props = {
  view: NbaAskView;
  language: string;
  onSelectPlayer?: (playerId: string) => void;
  onSelectTeam?: (teamId: string) => void;
};

/** ASK の答えの上に、チーム詳細・選手詳細・STATS・LEAGUE と同じ部品を同じ API のデータで出す */
export default function AskDetailViewNative({ view, language, onSelectPlayer, onSelectTeam }: Props) {
  const isJa = language === "ja";
  switch (view.kind) {
    case "today":
      return (
        <AskDailyLeadersNative
          date={view.id}
          stat={view.stat}
          count={view.count}
          language={language}
          onSelectPlayer={onSelectPlayer}
        />
      );
    case "standings":
      return (
        <NbaStandingsTablesNative
          conferences={view.id === "all" ? ["east", "west"] : [view.id]}
          language={language}
          onSelectTeam={onSelectTeam ?? (() => {})}
        />
      );
    case "leaders":
      return (
        <AskLeagueLeadersNative
          scope={view.scope}
          metric={view.id}
          count={view.count}
          team={view.team}
          worst={view.worst}
          onSelectPlayer={onSelectPlayer}
          onSelectTeam={onSelectTeam}
        />
      );
    case "ladder":
    case "milestones":
    case "hub":
      return (
        <LeagueHubSection view={view} language={language} onSelectPlayer={onSelectPlayer} onSelectTeam={onSelectTeam} />
      );
  }
  if (view.kind === "team") {
    const accent = getTeamUiAccentColor("nba", view.id);
    switch (view.section) {
      case "on_off":
        return <NbaTeamOnOffNative teamId={view.id} isJa={isJa} onSelectPlayer={onSelectPlayer} />;
      case "lineups":
        return (
          <View style={styles.lineups}>
            <NbaTeamLineupsNative
              teamId={view.id}
              isJa={isJa}
              accent={accent}
              initialSize={view.size}
              initialSide={view.mode}
            />
          </View>
        );
      case "how_they_play":
        return <TeamHowTheyPlay teamId={view.id} accent={accent} language={language} tab={view.tab} group={view.group} />;
      case "draft_picks":
        return <DraftPicksSection teamId={view.id} accent={accent} ui={nbaTeamDetailUiCopy(language)} />;
      default:
        return (
          <TeamDetailSection view={view} language={language} onSelectPlayer={onSelectPlayer} onSelectTeam={onSelectTeam} />
        );
    }
  }
  switch (view.section) {
    case "on_off":
      return <NbaPlayerOnOffNative playerId={view.id} isJa={isJa} />;
    case "matchups":
      return <NbaPlayerMatchupsNative playerId={view.id} isJa={isJa} initialSide={view.mode} />;
    default:
      return <PlayerDetailSection view={view} language={language} />;
  }
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color="#00F5FF" />
    </View>
  );
}

function LeagueHubSection({
  view,
  language,
  onSelectPlayer,
  onSelectTeam,
}: Omit<Props, "view"> & { view: Extract<NbaAskView, { kind: "ladder" | "milestones" | "hub" }> }) {
  const { hub, loading } = useNbaLeagueHubNative();
  if (!hub) return loading ? <Loading /> : null;
  const lang = language === "ja" ? "ja" : "en";
  const select = onSelectPlayer ?? (() => {});
  const selectTeam = onSelectTeam ?? (() => {});
  if (view.kind === "ladder") {
    return <LeagueHubAwardLadderNative hub={hub} lang={lang} award={view.id} limit={view.count} onSelectPlayer={select} />;
  }
  if (view.kind === "hub") {
    switch (view.id) {
      case "splits":
        return (
          <PlayerSplitsSection hub={hub} lang={lang} onSelectPlayer={select} initialMode={view.mode as SplitMode | undefined} />
        );
      case "hot_cold":
        return <HubHotColdSection hub={hub} lang={lang} onSelectPlayer={select} />;
      case "highs":
        return (
          <HubSeasonHighsSection
            hub={hub}
            lang={lang}
            onSelectPlayer={select}
            initialStat={view.mode as LeagueHubHighStat | undefined}
          />
        );
      case "top_games":
        return <HubTopGamesSection hub={hub} lang={lang} onSelectPlayer={select} />;
      case "value":
        return <ValueSection hub={hub} lang={lang} onSelectPlayer={select} initialMode={view.mode as ValueMode | undefined} />;
      case "on_off":
        return (
          <HubSection title="ON / OFF">
            <LeagueHubOnOffBestNative hub={hub} lang={lang} onSelectPlayer={select} />
          </HubSection>
        );
      case "team_records":
        return (
          <TeamRecords
            teams={hub.teams}
            lang={lang}
            onSelectTeam={selectTeam}
            initialMode={view.mode as RecordMode | undefined}
          />
        );
      case "schedule":
        return (
          <ScheduleStrength
            teams={hub.teams}
            lang={lang}
            onSelectTeam={selectTeam}
            initialMode={view.mode as "played" | "remaining" | undefined}
          />
        );
      case "picks":
        return <UniterzPicks teams={hub.teams} lang={lang} onSelectTeam={selectTeam} />;
    }
  }
  const mine = view.id === "all" ? hub : { ...hub, milestones: (hub.milestones ?? []).filter((m) => m.playerId === view.id) };
  return <MilestonesSection hub={mine} lang={lang} onSelectPlayer={select} />;
}

function TeamDetailSection({
  view,
  language,
  onSelectPlayer,
  onSelectTeam,
}: Props & { view: Extract<NbaAskView, { kind: "team" }> }) {
  const apiBaseUrl = getUniterzApiBaseUrl();
  const { bundle } = useLeagueTeamStatsBundle({ apiBaseUrl });
  const base = useMemo(() => getNbaTeamDetailPreview(view.id, bundle), [view.id, bundle]);
  const { detail, gameLogDetail, positionDefense, discipline, shapeEdges, loading } = useNbaTeamDetailLiveOverlay({
    teamId: view.id,
    apiBaseUrl,
    base,
  });
  if (loading) return <Loading />;
  const accent = getTeamUiAccentColor("nba", view.id);
  const ui = nbaTeamDetailUiCopy(language);
  switch (view.section) {
    case "payroll":
      return <PayrollSection payroll={detail.payroll} rosterBlock={detail.rosterBlock} accent={accent} ui={ui} />;
    case "injuries":
      return <InjuriesSection injuries={detail.injuries} accent={accent} ui={ui} onSelectPlayer={onSelectPlayer} />;
    case "game_logs": {
      const games = gameLogDetail?.games.length ? gameLogDetail.games : detail.recentGames;
      return (
        <GameLogsSection
          games={games.slice(0, view.count ?? 10)}
          accent={accent}
          ui={ui}
          language={language}
          onSelectPlayer={onSelectPlayer}
          onSelectTeam={onSelectTeam}
        />
      );
    }
    case "form":
      return <RecentFormSection games={detail.recentGames} streak={detail.streak} accent={accent} ui={ui} />;
    case "edge":
      return shapeEdges ? <TeamShapeEdgesSectionNative shapeEdges={shapeEdges} accent={accent} lang={ui.lang} /> : null;
    case "position_defense":
      return positionDefense ? (
        <NbaTeamPositionDefenseNative teamId={view.id} defense={positionDefense} accent={accent} ui={ui} />
      ) : null;
    case "splits": {
      if (!gameLogDetail) return null;
      const s = gameLogDetail.splits;
      return (
        <NbaTeamStatSplitTableNative
          accent={accent}
          rows={[
            { key: "home", label: "HOME", row: s.home },
            { key: "away", label: "AWAY", row: s.away },
            { key: "vsEast", label: "VS EAST", labelColor: "#EF3B24", row: s.vsEast },
            { key: "vsWest", label: "VS WEST", labelColor: "#007AC1", row: s.vsWest },
            { key: "vsOver500", label: "VS .500+", row: s.vsOver500 },
            { key: "vsUnder500", label: "VS SUB-.500", row: s.vsUnder500 },
            { key: "b2b", label: "B2B", row: s.b2b },
            { key: "threeInFour", label: "3IN4", row: s.threeInFour },
          ]}
        />
      );
    }
    case "roster":
      return (
        <NbaTeamRosterCardNative
          block={detail.rosterBlock}
          onPlayerPress={onSelectPlayer ? (player) => onSelectPlayer(String(player.id)) : undefined}
        />
      );
    case "discipline":
      return discipline ? (
        <NbaTeamDisciplineSectionNative
          teamId={view.id}
          initial={discipline}
          accent={accent}
          isJa={language === "ja"}
          lang={resolveLocalizedLang(language)}
          onPlayerPress={onSelectPlayer}
        />
      ) : null;
    default:
      return null;
  }
}

function PlayerDetailSection({
  view,
  language,
}: Props & { view: Extract<NbaAskView, { kind: "player" }> }) {
  const apiBaseUrl = getUniterzApiBaseUrl();
  const { bundle: leaders } = usePlayerStatLeadersBundle({ apiBaseUrl });
  const base = useMemo(() => getNbaPlayerDetailPreview(view.id), [view.id]);
  const { detail, discipline, loading } = useNbaPlayerDetailLiveOverlay({
    playerId: view.id,
    apiBaseUrl,
    base,
    leaders,
  });
  if (loading) return <Loading />;
  const accent = getTeamUiAccentColor("nba", detail.teamId);
  const seasonKey = detail.asOfLabel.match(/(\d{4}-\d{2})/)?.[1] ?? CURRENT_NBA_SEASON_KEY;
  switch (view.section) {
    case "contract":
      return <PlayerContractSection detail={detail} accent={accent} language={language} />;
    case "career":
      return (
        <SeasonHistorySection
          playerId={detail.playerId}
          regular={detail.careerSeasons.regular}
          playoffs={detail.careerSeasons.playoffs}
          accent={accent}
        />
      );
    case "profile":
      return (
        <View style={styles.stack}>
          <PlayerIdCard detail={detail} language={language === "ja" ? "ja" : "en"} />
          <PlayerMoreSection detail={detail} accent={accent} language={language} />
        </View>
      );
    case "shot_zones":
      return (
        <ShotZoneHeatmap
          zones={detail.shotZones}
          accent={accent}
          gamesPlayed={detail.season.gamesPlayed}
          seasonLabel={`${seasonKey} SEASON`}
        />
      );
    case "splits":
      return (
        <PlayerGameSplitsSectionNative
          logs={detail.seasonGameLogs ?? detail.gameLogs}
          seasonKey={seasonKey}
          accent={accent}
          language={language}
        />
      );
    case "season":
      return (
        <NbaPlayerSeasonAveragesNative
          metrics={detail.seasonMetrics}
          season={detail.season}
          logs={detail.gameLogs}
          accent={accent}
          language={language}
        />
      );
    case "how_they_play":
      return (
        <PlayerHowTheyPlay
          playerId={view.id}
          accent={accent}
          language={language}
          leaders={leaders}
          detail={detail}
          tab={view.tab}
          group={view.group}
        />
      );
    case "highs": {
      const logs = detail.seasonGameLogs ?? detail.gameLogs;
      return logs.length > 0 ? (
        <NbaPlayerHighsAndHitRatesNative seasonLogs={logs} accent={accent} language={language} />
      ) : null;
    }
    case "game_logs": {
      const logs = detail.gameLogs.slice(0, view.count ?? 5);
      return logs.length > 0 ? <NbaPlayerGameLogTableNative logs={logs} accent={accent} /> : null;
    }
    case "discipline":
      return discipline ? (
        <NbaPlayerDisciplineSectionNative
          playerId={view.id}
          initial={discipline}
          accent={accent}
          isJa={language === "ja"}
          lang={resolveLocalizedLang(language)}
        />
      ) : null;
    default:
      return null;
  }
}

const TEAM_HOW_TABS = ["fourFactors", "scoring", "playtype", "clutch", "hustle", "rebounding", "tracking"] as const;

function TeamHowTheyPlay({
  teamId,
  accent,
  language,
  tab,
  group,
}: {
  teamId: string;
  accent: string;
  language: string;
  tab?: NbaAskHowTab;
  group?: NbaAskHowGroup;
}) {
  const { bundle, loading } = useLeagueTeamStatsBundle({ apiBaseUrl: getUniterzApiBaseUrl() });
  if (loading) return <Loading />;
  return (
    <NbaTeamHowTheyPlayNative
      teamId={teamId}
      accent={accent}
      language={language}
      bundle={bundle}
      initialTab={TEAM_HOW_TABS.find((t) => t === tab)}
      initialTrackGroup={group}
    />
  );
}

/** HOW THEY PLAY はチームのリーグ表も要るので、このときだけ読む */
function PlayerHowTheyPlay({
  playerId,
  accent,
  language,
  leaders,
  detail,
  tab,
  group,
}: {
  playerId: string;
  accent: string;
  language: string;
  leaders: ComponentProps<typeof NbaPlayerHowTheyPlayNative>["leaders"];
  detail: ComponentProps<typeof NbaPlayerHowTheyPlayNative>["detail"];
  tab?: NbaAskHowTab;
  group?: NbaAskHowGroup;
}) {
  const { bundle: teamStats } = useLeagueTeamStatsBundle({ apiBaseUrl: getUniterzApiBaseUrl() });
  return (
    <NbaPlayerHowTheyPlayNative
      playerId={playerId}
      accent={accent}
      language={language}
      leaders={leaders}
      teamStats={teamStats}
      detail={detail}
      initialTab={tab}
      initialTrackGroup={group}
    />
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 24, alignItems: "center" },
  stack: { gap: 16 },
  /** 詳細ではセクション見出しの直下に詰めるための負マージンを打ち消す */
  lineups: { paddingTop: 12 },
});
