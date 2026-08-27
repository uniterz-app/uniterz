import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { colors, spacing } from "../../theme/tokens";
import {
  OVERLAY_RESULT_STAT_LABEL_W,
  OVERLAY_RESULT_STAT_ROW_GAP,
  OVERLAY_RESULT_STAT_VALUE_W,
} from "../results/resultMobileUiNative";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import MatchCardOverlayMarketBarNative from "./MatchCardOverlayMarketBarNative";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import { PredictToolTabContent } from "./PredictToolTabContent";
import type { NativeGameRow, SupportedLeague } from "./useTodayGames";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import MatchTeamMarkNative from "./MatchTeamMarkNative";
import { LiveMarkPill } from "./LiveMarkPill";
import MatchPkResultLineNative from "./MatchPkResultLineNative";
import {
  liveMarkPillCyberBase,
  liveMarkTextCyberBase,
} from "../../ui/liveMarkCyberStyles";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import {
  WcGoalScorerResultRowNative,
  WcTeamFlagWithMetaNative,
  WcGroupStandingRecordLineNative,
  resolveWcGroupStageStandingForKnockoutDisplay,
  WcGoalScorerPickerNative,
  WcMatchPreviewPanelNative,
  WcStandingPanelNative,
  WcPastResultsPanelNative,
  WcTeamProfilePanelNative,
  type GoalScorerPick as WcGoalScorerPick,
  hasWcMatchPreview,
  WcTeamNameMobileNative,
  WcBroadcastNamesNative,
} from "./legacyWcNativeShims";
import ResultStatRatingBarNative from "../results/ResultStatRatingBarNative";
import NbaTopScorerResultRowNative from "../results/NbaTopScorerResultRowNative";
import ResultOutcomeBadgesNative from "../results/ResultOutcomeBadgesNative";
import {
  formatTeamRecordLabelNative,
  useTeamRecordLineNative,
} from "./useTeamRecordLineNative";
import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";
import PredictionScoringRulesChipNative from "./PredictionScoringRulesChipNative";
import MatchListLineFrameNative from "./MatchListLineFrameNative";
import { resultOutcomeLineFramePaint } from "@/lib/games/matchListLineFrame";
import NbaPredictToolsTabsNative from "./predict/NbaPredictToolsTabsNative";
import LiveGameStatsPanelNative from "./live/LiveGameStatsPanelNative";
import LiveGameStatsPlaceholderNative from "./live/LiveGameStatsPlaceholderNative";
import { useLiveGameStats } from "../../../../../lib/games/useLiveGameStats";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";
import CountryFlagNative from "./CountryFlagNative";
import NbaTopScorerPickerNative from "./predict/NbaTopScorerPickerNative";
import {
  normalizeNbaTopScorerCandidates,
  normalizeNbaTopScorerPick,
  type NbaTopScorerPick,
} from "../../../../../lib/nba/topScorer";
import type { PredictModalMergedFinalPreview } from "./buildPredictModalMergedFinal";
import {
  PREDICT_MODAL_EXIT_COMPLETION_MS,
  predictModalBackdropEnter,
  predictModalBackdropExit,
  predictModalPreviewEnter,
  predictModalSheetEnter,
  predictModalTutorialBackdropEnter,
  predictModalTutorialSheetEnter,
  predictModalSheetExit,
  predictBlockFadeUpEnter,
  predictPanelRevealEnter,
} from "./predictMotion";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";
import PredictOverlayActionFabNative from "./PredictOverlayActionFabNative";
import ShareLinkCaptureFooterNative from "../share/ShareLinkCaptureFooterNative";
import { shareResultCardNative } from "../results/shareResultCardNative";
import { buildResultShareUrl, getShareAppOrigin } from "../../../../../lib/share/shareAppUrls";
import { t as i18nT } from "../../../../../lib/i18n/t";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import PredictOverlayCyberDeckTabNative from "./PredictOverlayCyberDeckTabNative";
import PredictOverlayCyberFormPanelNative from "./PredictOverlayCyberFormPanelNative";
import PredictOverlayScoreInputNative from "./PredictOverlayScoreInputNative";
import TutorialPredictAnnotatorNative from "../tutorial/TutorialPredictAnnotatorNative";
import TutorialTargetNative from "../tutorial/TutorialTargetNative";
import {
  registerTutorialScrollHost,
  registerTutorialTarget,
} from "../tutorial/tutorialMeasureNative";
import { TUTORIAL_CYAN } from "../../../../../lib/tutorial/tutorialMotion";
import type { Language } from "../../../../../lib/i18n/language";
import PredictOverlaySubmitButtonNative from "./PredictOverlaySubmitButtonNative";
import { PREDICT_OVERLAY_CYBER_DECK_CUT } from "./matchListCyberClipPath";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_LETTER_SPACING_15,
  MATCH_CARD_BRACKET_TEXT,
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "./matchCardTypography";

function ToolPanelGridOverlay() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const step = 22;
  const vLines = useMemo(() => {
    const out: number[] = [];
    const max = Math.max(0, Math.round(size.width) - 1);
    for (let x = 0; x <= max; x += step) out.push(x);
    if (max > 0 && out[out.length - 1] !== max) out.push(max);
    return out;
  }, [size.width]);
  const hLines = useMemo(() => {
    const out: number[] = [];
    const max = Math.max(0, Math.round(size.height) - 1);
    for (let y = 0; y <= max; y += step) out.push(y);
    if (max > 0 && out[out.length - 1] !== max) out.push(max);
    return out;
  }, [size.height]);
  return (
    <View
      pointerEvents="none"
      style={s.toolGridLayer}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        const h = e.nativeEvent.layout.height;
        if (Math.abs(w - size.width) < 0.5 && Math.abs(h - size.height) < 0.5) return;
        setSize({ width: w, height: h });
      }}
    >
      <View style={[StyleSheet.absoluteFillObject, { opacity: 0.32 }]}>
        {vLines.map((x) => (
          <View key={`tool-v-${x}`} style={[s.toolGridVLine, { left: x }]} />
        ))}
        {hLines.map((y) => (
          <View key={`tool-h-${y}`} style={[s.toolGridHLine, { top: y }]} />
        ))}
      </View>
    </View>
  );
}

export type PredictModalScheduleMeta = {
  kickoffValue: string;
  broadcastLabels: string[];
};

export type PredictModalWcGoalScorer = {
  playerName: string;
  teamId: string;
};

/** 予想モーダル最上段：試合一覧の MatchCard 相当（Web オーバーレイと同順） */
export type PredictToolsTab =
  | null
  | "h2h"
  | "market"
  | "stats"
  | "preview"
  | "results"
  | "standings"
  | "injuries"
  | "roster";

export type PredictModalMatchPreview = {
  roundLabel: string | null;
  homeCompact: string;
  awayCompact: string;
  homeRecord: string | null;
  awayRecord: string | null;
  centerBlock: GameCardCenterBlock;
  seriesLabel: string | null;
  /** プレーオフ等：中央の (n-m) をチーム色分け表示する用 */
  seriesPair: { home: number; away: number } | null;
  homePalette: { primary: string; secondary: string };
  awayPalette: { primary: string; secondary: string };
  leagueRaw: unknown;
  homeSide: unknown;
  awaySide: unknown;
  knockout?: boolean;
  season?: string | null;
};

export type PredictOverlayMarketBarProps = {
  gameId: string;
  league: string;
  status: "scheduled" | "live" | "final";
  score: { home: number; away: number } | null;
  fallbackMarketBias?: { homePct: number; awayPct: number } | null;
  homeColor: string;
  awayColor: string;
  homeLabel: string;
  awayLabel: string;
  compact?: boolean;
  userPredictionWinner?: "home" | "away" | "draw" | null;
};

export function PredictMatchPreview({
  data,
  onClose,
  closeLabel,
  overlayMarketBar,
  language,
  t,
  mergedPrediction,
  mergedFinal,
  scheduleMeta,
  wcGoalScorer,
  isWcLeague = false,
  overlayCenterMode = false,
  onEditPrediction,
  showEditButton = false,
  overlayUnifiedForm: _overlayUnifiedForm = false,
  hideCloseButton = false,
  myPostId = null,
  tutorialMode = false,
}: {
  data: PredictModalMatchPreview;
  onClose: () => void;
  closeLabel: string;
  overlayMarketBar?: PredictOverlayMarketBarProps | null;
  language: GamesLanguage;
  t: GamesTexts;
  /** Web `showMergedResult` 相当：未開始試合の中央に予想スコア */
  mergedPrediction?: { home: number; away: number } | null;
  /** Web `showMergedResult` + 試合終了：確定スコア＋予想スコア＋スタッツ */
  mergedFinal?: PredictModalMergedFinalPreview | null;
  scheduleMeta?: PredictModalScheduleMeta | null;
  wcGoalScorer?: PredictModalWcGoalScorer | null;
  isWcLeague?: boolean;
  /** Web オーバーレイ：未開始試合の中央を VS にする */
  overlayCenterMode?: boolean;
  onEditPrediction?: () => void;
  showEditButton?: boolean;
  overlayUnifiedForm?: boolean;
  hideCloseButton?: boolean;
  myPostId?: string | null;
  tutorialMode?: boolean;
}) {
  const captureRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const resultCopy = i18nT(language).results;

  /** リザルト詳細チュートリアル: カード全体を1つの穴として測る */
  useEffect(() => {
    if (!mergedFinal) return;
    return registerTutorialTarget("result-detail-card", () =>
      new Promise((resolve) => {
        const node = captureRef.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width < 1 || height < 1) {
            resolve(null);
            return;
          }
          resolve({ x, y, width, height });
        });
      })
    );
  }, [mergedFinal]);
  const { centerBlock, seriesPair } = data;
  const isKnockout = data.knockout === true;
  const homeTeamId = rawTeamIdFromGameSide(data.homeSide);
  const awayTeamId = rawTeamIdFromGameSide(data.awaySide);
  const showOverlayVs =
    overlayCenterMode &&
    isWcLeague &&
    !mergedFinal &&
    !mergedPrediction &&
    centerBlock.variant === "time";
  const goalScorerInfo =
    mergedFinal?.wcGoalScorer ??
    (wcGoalScorer ? { ...wcGoalScorer, hit: null as boolean | null } : null);
  const leagueRaw = String(data.leagueRaw ?? "");
  const homeRecordLine = useTeamRecordLineNative(
    isWcLeague ? homeTeamId : null,
    leagueRaw
  );
  const awayRecordLine = useTeamRecordLineNative(
    isWcLeague ? awayTeamId : null,
    leagueRaw
  );
  const homeWcRecordLabel = formatTeamRecordLabelNative(
    homeTeamId,
    leagueRaw,
    homeRecordLine
  );
  const awayWcRecordLabel = formatTeamRecordLabelNative(
    awayTeamId,
    leagueRaw,
    awayRecordLine
  );
  const homeGroupStanding = useMemo(
    () =>
      isKnockout && isWcLeague
        ? resolveWcGroupStageStandingForKnockoutDisplay(
            homeTeamId,
            homeRecordLine
          )
        : null,
    [isKnockout, isWcLeague, homeTeamId, homeRecordLine]
  );
  const awayGroupStanding = useMemo(
    () =>
      isKnockout && isWcLeague
        ? resolveWcGroupStageStandingForKnockoutDisplay(
            awayTeamId,
            awayRecordLine
          )
        : null,
    [isKnockout, isWcLeague, awayTeamId, awayRecordLine]
  );
  const wcBroadcastSep = language === "ja" ? "：" : ": ";
  const canShare = Boolean(myPostId && (mergedFinal || mergedPrediction));
  const showActionMenu = Boolean(
    (showEditButton && onEditPrediction) || canShare
  );
  const shareLinkUrl = useMemo(
    () => (myPostId ? buildResultShareUrl(myPostId) : ""),
    [myPostId]
  );
  const totalPoints = useMemo(() => {
    const row = mergedFinal?.statRows.find((r) => r.key === "pointsV3");
    return row?.value ?? null;
  }, [mergedFinal?.statRows]);

  const handleShareResult = useCallback(async () => {
    if (!canShare || !myPostId || sharing) return;
    const predictedHome =
      mergedFinal?.predictedScore.home ?? mergedPrediction?.home ?? null;
    const predictedAway =
      mergedFinal?.predictedScore.away ?? mergedPrediction?.away ?? null;
    if (predictedHome == null || predictedAway == null) return;

    setSharing(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    try {
      const shareOutcome = await shareResultCardNative(captureRef, {
        language,
        homeName: data.homeCompact,
        awayName: data.awayCompact,
        predictedHome,
        predictedAway,
        finalHome: mergedFinal?.finalScore.home ?? null,
        finalAway: mergedFinal?.finalScore.away ?? null,
        totalPoints,
        postId: myPostId,
        appBaseUrl: getShareAppOrigin(),
      });
      if (shareOutcome === "failed") {
        cyberAlert("", resultCopy.shareResultCardFailed);
      }
    } finally {
      setSharing(false);
    }
  }, [
    canShare,
    data.awayCompact,
    data.homeCompact,
    language,
    mergedFinal,
    mergedPrediction?.away,
    mergedPrediction?.home,
    myPostId,
    resultCopy.shareResultCardFailed,
    sharing,
    totalPoints,
  ]);

  const previewBody = (
      <View pointerEvents="box-none" style={s.matchPreviewPaddedContent}>
        <TutorialTargetNative id="predict-sides">
        <View style={s.matchPreviewGrid}>
          {showOverlayVs ? (
            <View pointerEvents="none" style={s.matchPreviewVsOverlay}>
              <Text style={s.matchPreviewVsLabel}>VS</Text>
            </View>
          ) : null}
          <View style={s.matchPreviewCol}>
            {!isWcLeague ? (
              <Text style={s.matchPreviewSideTag}>HOME</Text>
            ) : null}
            <View style={s.matchPreviewJersey}>
              <WcTeamFlagWithMetaNative
                teamId={isWcLeague ? homeTeamId : null}
                knockout={isKnockout}
              >
                <MatchTeamMarkNative
                  leagueRaw={data.leagueRaw}
                  side={data.homeSide}
                  palette={data.homePalette}
                  jerseySize={48}
                  flagVariant={
                    isWcLeague ? (mergedFinal ? "overlay" : "preview") : "card"
                  }
                />
              </WcTeamFlagWithMetaNative>
            </View>
            {isWcLeague ? (
              <WcTeamNameMobileNative
                name={data.homeCompact}
                style={[s.matchPreviewTeamName, s.matchPreviewTeamNameWc]}
              />
            ) : (
              <Text style={s.matchPreviewTeamName} numberOfLines={1}>
                {data.homeCompact}
              </Text>
            )}
            {isWcLeague && isKnockout ? (
              <WcGroupStandingRecordLineNative
                standing={homeGroupStanding}
                language={language}
                textStyle={s.matchPreviewRecordBracket}
              />
            ) : isWcLeague ? (
              <Text style={s.matchPreviewRecordBracket}>{homeWcRecordLabel}</Text>
            ) : data.homeRecord ? (
              <Text style={s.matchPreviewRecord}>{data.homeRecord}</Text>
            ) : null}
          </View>
          <View style={[s.matchPreviewCenter, mergedFinal && s.matchPreviewCenterFinal]}>
            {mergedFinal ? (
              <TutorialTargetNative id="result-detail-score">
                <View style={s.matchPreviewFinalBlock}>
                  <Text style={s.matchPreviewScoreRow} numberOfLines={1}>
                    <Text style={s.matchPreviewScoreNum}>
                      {mergedFinal.finalScore.home}
                    </Text>
                    <Text style={s.matchPreviewScoreDash}> – </Text>
                    <Text style={s.matchPreviewScoreNum}>
                      {mergedFinal.finalScore.away}
                    </Text>
                  </Text>
                  <Text style={s.matchPreviewSub} numberOfLines={1}>
                    {mergedFinal.finalLabel}
                  </Text>
                  {mergedFinal.pkScore ? (
                    <MatchPkResultLineNative
                      pkScore={mergedFinal.pkScore}
                      density="overlay"
                      wc={isWcLeague}
                    />
                  ) : null}
                  <Text style={s.matchPreviewOverlayPredictKicker} numberOfLines={1}>
                    {t.myPrediction}
                  </Text>
                  <Text style={s.matchPreviewOverlayPredictRow} numberOfLines={1}>
                    <Text style={s.matchPreviewOverlayPredictNum}>
                      {mergedFinal.predictedScore.home}
                    </Text>
                    <Text style={s.matchPreviewOverlayPredictDash}> – </Text>
                    <Text style={s.matchPreviewOverlayPredictNum}>
                      {mergedFinal.predictedScore.away}
                    </Text>
                  </Text>
                </View>
              </TutorialTargetNative>
            ) : mergedPrediction ? (
              <View style={s.matchPreviewMergedBlock}>
                <Text style={s.matchPreviewMergedKicker} numberOfLines={1}>
                  {t.myPrediction}
                </Text>
                <Text style={s.matchPreviewMergedScoreRow} numberOfLines={1}>
                  <Text style={s.matchPreviewMergedScoreNum}>
                    {mergedPrediction.home}
                  </Text>
                  <Text style={s.matchPreviewMergedScoreDash}> – </Text>
                  <Text style={s.matchPreviewMergedScoreNum}>
                    {mergedPrediction.away}
                  </Text>
                </Text>
              </View>
            ) : showOverlayVs ? (
              <View style={s.matchPreviewVsBlock} />
            ) : centerBlock.variant === "score" ? (
              <View style={s.matchPreviewVsBlock}>
                <Text style={s.matchPreviewScoreRow} numberOfLines={1}>
                  <Text style={s.matchPreviewScoreNum}>{centerBlock.home}</Text>
                  <Text style={s.matchPreviewScoreDash}> – </Text>
                  <Text style={s.matchPreviewScoreNum}>{centerBlock.away}</Text>
                </Text>
                {centerBlock.subLine ? (
                  <Text style={s.matchPreviewSub} numberOfLines={2}>
                    {centerBlock.subLine}
                  </Text>
                ) : null}
                {centerBlock.pkScore ? (
                  <MatchPkResultLineNative
                    pkScore={centerBlock.pkScore}
                    density="overlay"
                    wc={isWcLeague}
                  />
                ) : null}
                {seriesPair != null ? (
                  <View style={s.matchPreviewSeriesRow}>
                    <PlayoffSeriesScoreInline
                      homeWins={seriesPair.home}
                      awayWins={seriesPair.away}
                      variant="preview"
                    />
                  </View>
                ) : data.seriesLabel ? (
                  <Text style={s.matchPreviewSeries}>{data.seriesLabel}</Text>
                ) : null}
              </View>
            ) : centerBlock.variant === "liveMark" ? (
              <View style={s.matchPreviewVsBlock}>
                <LiveMarkPill
                  pillStyle={s.matchPreviewLivePill}
                  textStyle={s.matchPreviewLivePillText}
                />
                {centerBlock.subLine ? (
                  <Text style={s.matchPreviewSub} numberOfLines={2}>
                    {centerBlock.subLine}
                  </Text>
                ) : null}
                {seriesPair != null ? (
                  <View style={s.matchPreviewSeriesRow}>
                    <PlayoffSeriesScoreInline
                      homeWins={seriesPair.home}
                      awayWins={seriesPair.away}
                      variant="preview"
                    />
                  </View>
                ) : data.seriesLabel ? (
                  <Text style={s.matchPreviewSeries}>{data.seriesLabel}</Text>
                ) : null}
              </View>
            ) : (
              <View style={s.matchPreviewVsBlock}>
                <Text style={s.matchPreviewVsText} numberOfLines={1}>
                  {centerBlock.time}
                </Text>
                {seriesPair != null ? (
                  <View style={s.matchPreviewSeriesRow}>
                    <PlayoffSeriesScoreInline
                      homeWins={seriesPair.home}
                      awayWins={seriesPair.away}
                      variant="preview"
                    />
                  </View>
                ) : data.seriesLabel ? (
                  <Text style={s.matchPreviewSeries}>{data.seriesLabel}</Text>
                ) : null}
              </View>
            )}
          </View>
          <View style={s.matchPreviewCol}>
            {!isWcLeague ? (
              <Text style={s.matchPreviewSideTag}>AWAY</Text>
            ) : null}
            <View style={s.matchPreviewJersey}>
              <WcTeamFlagWithMetaNative
                teamId={isWcLeague ? awayTeamId : null}
                knockout={isKnockout}
              >
                <MatchTeamMarkNative
                  leagueRaw={data.leagueRaw}
                  side={data.awaySide}
                  palette={data.awayPalette}
                  jerseySize={48}
                  flagVariant={
                    isWcLeague ? (mergedFinal ? "overlay" : "preview") : "card"
                  }
                />
              </WcTeamFlagWithMetaNative>
            </View>
            {isWcLeague ? (
              <WcTeamNameMobileNative
                name={data.awayCompact}
                style={[s.matchPreviewTeamName, s.matchPreviewTeamNameWc]}
              />
            ) : (
              <Text style={s.matchPreviewTeamName} numberOfLines={1}>
                {data.awayCompact}
              </Text>
            )}
            {isWcLeague && isKnockout ? (
              <WcGroupStandingRecordLineNative
                standing={awayGroupStanding}
                language={language}
                textStyle={s.matchPreviewRecordBracket}
              />
            ) : isWcLeague ? (
              <Text style={s.matchPreviewRecordBracket}>{awayWcRecordLabel}</Text>
            ) : data.awayRecord ? (
              <Text style={s.matchPreviewRecord}>{data.awayRecord}</Text>
            ) : null}
          </View>
        </View>
        </TutorialTargetNative>
        {scheduleMeta && !mergedFinal ? (
          <View style={s.matchPreviewScheduleMeta}>
            <View style={s.matchPreviewScheduleMetaRow}>
              {scheduleMeta.kickoffValue ? (
                <View
                  style={[
                    s.matchPreviewScheduleMetaGroup,
                    scheduleMeta.broadcastLabels.length > 0 &&
                      s.matchPreviewScheduleMetaGroupAfter,
                  ]}
                >
                  <Text style={s.matchPreviewScheduleMetaLabel}>{t.kickoffAt}</Text>
                  <Text style={s.matchPreviewScheduleMetaValue}>
                    {scheduleMeta.kickoffValue}
                  </Text>
                </View>
              ) : null}
              {scheduleMeta.broadcastLabels.length > 0 ? (
                <View style={s.matchPreviewScheduleMetaGroup}>
                  <Text style={s.matchPreviewScheduleMetaLabel}>{t.broadcasters}</Text>
                  <WcBroadcastNamesNative
                    labels={scheduleMeta.broadcastLabels}
                    separator={wcBroadcastSep}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
        {overlayMarketBar ? (
          <View style={s.matchPreviewMarketBarWrap}>
            {tutorialMode ? (
              <TutorialTargetNative id="predict-market">
                <MatchCardOverlayMarketBarNative
                  {...overlayMarketBar}
                  language={language}
                  t={t}
                />
              </TutorialTargetNative>
            ) : (
              <MatchCardOverlayMarketBarNative
                {...overlayMarketBar}
                language={language}
                t={t}
              />
            )}
          </View>
        ) : null}
        {goalScorerInfo ? (
          <View style={s.matchPreviewGoalScorerWrap}>
            <View style={s.matchPreviewGoalScorerDivider} />
            <WcGoalScorerResultRowNative
              label={t.wcGoalScorerLabel}
              info={goalScorerInfo}
              cyberValue
            />
          </View>
        ) : null}
        {mergedFinal &&
        (mergedFinal.nbaTopScorer || mergedFinal.statRows.length > 0) ? (
          <TutorialTargetNative id="result-detail-stats">
            <View style={s.matchPreviewStatBlock}>
              <View style={s.matchPreviewStatHairline} />
              {mergedFinal.nbaTopScorer ? (
                <NbaTopScorerResultRowNative
                  label={mergedFinal.nbaTopScorerLabel}
                  info={mergedFinal.nbaTopScorer}
                />
              ) : null}
              {mergedFinal.statRows.map((row) => (
                <View key={row.key} style={s.matchPreviewStatRow}>
                  <Text style={s.matchPreviewStatLabel} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <View style={s.matchPreviewStatBarSlot}>
                    <ResultStatRatingBarNative
                      ratio={row.ratio}
                      size="lg"
                      metricKey={row.key}
                    />
                  </View>
                  <Text
                    style={[
                      s.matchPreviewStatValue,
                      row.valueTone === "yellow" && s.matchPreviewStatValueYellow,
                      row.valueTone === "red" && s.matchPreviewStatValueRed,
                    ]}
                  >
                    {row.display}
                  </Text>
                </View>
              ))}
            </View>
          </TutorialTargetNative>
        ) : null}
        <ShareLinkCaptureFooterNative url={shareLinkUrl} visible={sharing} />
      </View>
  );

  return (
    <View style={s.matchPreviewWrap}>
      <View ref={captureRef} collapsable={false}>
      <TutorialTargetNative id="predict-round">
        <MatchListLineFrameNative
          topLabel={data.roundLabel || undefined}
          predicted={Boolean(myPostId) && !mergedFinal}
          paint={resultOutcomeLineFramePaint(mergedFinal?.badge)}
        >
          {previewBody}
        </MatchListLineFrameNative>
      </TutorialTargetNative>
      </View>
      {mergedFinal?.badge || mergedFinal?.streakBadge ? (
        <View
          pointerEvents="none"
          style={s.matchPreviewOutcomeBadge}
        >
          <ResultOutcomeBadgesNative
            badge={mergedFinal.badge}
            outcomeBadge={mergedFinal.outcomeBadge}
            showStreakBadge={mergedFinal.showStreakBadge}
            stackBadges={mergedFinal.stackBadges}
            streakBadge={mergedFinal.streakBadge}
            activeWinStreak={mergedFinal.activeWinStreak}
            badgeScale={0.88}
          />
        </View>
      ) : null}
      {showActionMenu ? (
        <PredictOverlayActionFabNative
          showClose={false}
          onClose={onClose}
          closeLabel={closeLabel}
          showEdit={Boolean(showEditButton && onEditPrediction)}
          showShare={canShare}
          onEdit={onEditPrediction}
          onShare={() => void handleShareResult()}
          menuLabel={resultCopy.openActions}
          editLabel={t.editScoresCta}
          shareLabel={resultCopy.shareMyResult}
        />
      ) : null}
    </View>
  );
}

type PredictModalProps = {
  visible: boolean;
  /** 開いている試合のプレビュー。Web のオーバーレイ上段 MatchCard に相当 */
  matchPreview: PredictModalMatchPreview | null;
  t: GamesTexts;
  predictHomeTeamLabel: string;
  predictAwayTeamLabel: string;
  predictToolsTab: PredictToolsTab;
  setPredictToolsTab: (value: PredictToolsTab) => void;
  winner: "home" | "away" | "draw" | null;
  isSoccerPredict: boolean;
  /** WC ノックアウト — 同点時は PK 進出選択が必要 */
  isKnockoutPredict?: boolean;
  pkWinner?: "home" | "away" | null;
  setPkWinner?: (value: "home" | "away" | null) => void;
  scoreAway: string;
  setScoreAway: (value: string) => void;
  scoreHome: string;
  setScoreHome: (value: string) => void;
  predictSubmitting: boolean;
  isEditingPrediction: boolean;
  onSubmit: () => void;
  onClose: () => void;
  /** 試合開始済み・未投稿: Web `PredictionFormV2` overlay と同様スコア入力・送信を出さない */
  spectatorStartedNoPost?: boolean;
  /** 試合開始後（キックオフ時刻経過・LIVE・終了）は予想の修正 UI（「修正」・スコア再入力）を出さない */
  predictionEditLockedAfterKickoff?: boolean;
  /**
   * 編集モードで開いた直後からスコア入力ブロックを表示する。
   * ゲーム一覧は要約→「修正」の2段が既定。リザルト一覧からは一覧上でそのまま得点を変えられるようにする。
   */
  expandScoreFormWhenEditing?: boolean;
  /** タブ（市場・H2H・スタッツ）用の実データ: Firestore `posts` / `teams` および peer 試合 */
  predictData?: {
    gameId: string;
    league: SupportedLeague;
    language: GamesLanguage;
    subjectGame: NativeGameRow;
    peerGames: NativeGameRow[];
    formatGameDateMs: (ms: number) => string;
    isSoccerLeague: boolean;
  } | null;
  overlayMarketBar?: PredictOverlayMarketBarProps | null;
  language: GamesLanguage;
  /** Web `showOverlayScheduleMeta` 相当（未開始試合のキックオフ・放送局） */
  predictScheduleMeta?: PredictModalScheduleMeta | null;
  wcGoalScorerPreview?: PredictModalWcGoalScorer | null;
  goalScorerPick?: WcGoalScorerPick | NbaTopScorerPick | null;
  setGoalScorerPick?: (value: WcGoalScorerPick | NbaTopScorerPick | null) => void;
  mergedFinalPreview?: PredictModalMergedFinalPreview | null;
  /** 親の predict-overlay-cyber-form 一枚に内包（MatchCard + フォームを分割しない） */
  overlayUnifiedForm?: boolean;
  /** 自分の投稿 ID（共有キャプチャ用） */
  myPostId?: string | null;
  /** Pro プラン — NBA Predict Timing UI（Pro Insight / 同帯バー） */
  isProUser?: boolean;
  /** チュートリアル練習用の案内バナー */
  tutorialMode?: boolean;
  onOpenTeamDetail?: (teamId: string) => void;
  onOpenPlayerDetail?: (
    playerId: string,
    toolsTab?: "injuries" | "roster"
  ) => void;
};

/** モバイル `PredictionFormV2`：glassCard（form）/ glassCardStatsPanel（tool） */
function GlassPanel({
  children,
  variant = "form",
  showGrid = false,
}: {
  children: React.ReactNode;
  /** formCompact: 「あなたの予想」要約など縦幅を詰める */
  variant?: "form" | "formCompact" | "tool";
  showGrid?: boolean;
}) {
  return (
    <View
      style={[
        s.glassBase,
        variant === "tool" ? s.glassOuterTool : s.glassOuterForm,
      ]}
    >
      {(Platform.OS === "ios" || Platform.OS === "android") && (
        <BlurView
          intensity={Platform.OS === "ios" ? 24 : 20}
          tint="dark"
          {...nativeBlurViewExtraProps()}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={s.glassPanelTint} pointerEvents="none" />
      {showGrid ? <ToolPanelGridOverlay /> : null}
      <View
        style={
          variant === "tool"
            ? s.glassPanelContentTool
            : variant === "formCompact"
              ? s.glassPanelContentFormCompact
              : s.glassPanelContentForm
        }
      >
        {children}
      </View>
    </View>
  );
}

/** 統合オーバーレイ用の一枚カードラッパー */
function PredictModalContentShell({
  unified,
  children,
}: {
  unified: boolean;
  children: React.ReactNode;
}) {
  if (!unified) return <>{children}</>;
  return (
    <PredictOverlayCyberFormPanelNative contentStyle={s.unifiedOverlayPanelContent}>
      {children}
    </PredictOverlayCyberFormPanelNative>
  );
}

export default function PredictModal({
  visible,
  matchPreview,
  t,
  predictHomeTeamLabel,
  predictAwayTeamLabel,
  predictToolsTab,
  setPredictToolsTab,
  winner,
  isSoccerPredict,
  isKnockoutPredict = false,
  pkWinner = null,
  setPkWinner,
  scoreAway,
  setScoreAway,
  scoreHome,
  setScoreHome,
  predictSubmitting,
  isEditingPrediction,
  onSubmit,
  onClose,
  spectatorStartedNoPost = false,
  predictionEditLockedAfterKickoff = false,
  expandScoreFormWhenEditing = false,
  predictData = null,
  overlayMarketBar = null,
  language,
  predictScheduleMeta = null,
  wcGoalScorerPreview = null,
  goalScorerPick = null,
  setGoalScorerPick,
  mergedFinalPreview = null,
  overlayUnifiedForm = false,
  myPostId = null,
  isProUser = false,
  tutorialMode = false,
  onOpenTeamDetail,
  onOpenPlayerDetail,
}: PredictModalProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() ?? false;
  const [tutorialAnnotDismissed, setTutorialAnnotDismissed] = useState(false);
  const [tutorialUserScrollEnabled, setTutorialUserScrollEnabled] =
    useState(true);
  const tutorialMsgs = i18nT(
    (language === "en" ? "en" : "ja") as Language
  ).tutorial.practice;
  const predictScrollRef = useRef<ScrollView>(null);
  const predictScrollYRef = useRef(0);

  useEffect(() => {
    if (visible && tutorialMode) setTutorialAnnotDismissed(false);
    if (!visible || !tutorialMode) setTutorialUserScrollEnabled(true);
  }, [visible, tutorialMode]);

  useEffect(() => {
    if (!visible || !tutorialMode) return;
    return registerTutorialScrollHost({
      getOffsetY: () => predictScrollYRef.current,
      scrollBy: (dy, animated) => {
        /** 連続 scrollBy で古い offset を使わない（枠ずれ防止） */
        const y = Math.max(0, predictScrollYRef.current + dy);
        predictScrollYRef.current = y;
        predictScrollRef.current?.scrollTo({
          y,
          animated,
        });
      },
      setScrollEnabled: setTutorialUserScrollEnabled,
      getViewportInWindow: () =>
        new Promise((resolve) => {
          const node = predictScrollRef.current;
          if (!node) {
            resolve(null);
            return;
          }
          node.measureInWindow((_x, y, _w, h) => {
            resolve(h > 32 ? { y, height: h } : null);
          });
        }),
    });
  }, [visible, tutorialMode]);

  /**
   * チュートリアル中はスライド入場を避け、ゆったりフェードのみ。
   * 注釈は TUTORIAL_PREDICT_ANNOT_REVEAL_DELAY_MS 後に重ねる。
   */
  const toolPanelIn =
    reduceMotion || tutorialMode ? undefined : predictPanelRevealEnter();
  /** オーバーレイ内包時は stagger なし（Web `overlayEmbedded` 相当） */
  const scoreBlockEnter =
    reduceMotion || tutorialMode || overlayUnifiedForm
      ? undefined
      : predictBlockFadeUpEnter(1);

  const backdropEnter = reduceMotion
    ? undefined
    : tutorialMode
      ? predictModalTutorialBackdropEnter()
      : predictModalBackdropEnter();
  const backdropExit = reduceMotion ? undefined : predictModalBackdropExit();
  const sheetEnter = reduceMotion
    ? undefined
    : tutorialMode
      ? predictModalTutorialSheetEnter()
      : predictModalSheetEnter();
  const sheetExit = reduceMotion ? undefined : predictModalSheetExit();

  const [layersVisible, setLayersVisible] = useState(visible);

  const previewEnter =
    reduceMotion || tutorialMode ? undefined : predictModalPreviewEnter();

  /** 直接対決／市場／詳細スタッツ：タップでパネルを開閉 */
  function handleToolTabPress(
    tab:
      | "h2h"
      | "market"
      | "stats"
      | "preview"
      | "results"
      | "standings"
      | "injuries"
      | "roster"
  ) {
    if (predictToolsTab === tab) setPredictToolsTab(null);
    else setPredictToolsTab(tab);
  }

  const [exitingUi, setExitingUi] = useState(false);
  /** 予想済み: 最初は要約、キックオフ前のみ「修正」でスコア入力＋送信 */
  const [scoreFormExpanded, setScoreFormExpanded] = useState(true);
  const closeAnimLockRef = useRef(false);
  const closeAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * `visible` が true になった直後、`useEffect` だと 1 フレーム遅れて `layersVisible` が true になり、
   * 中身のない Modal＋全面 Pressable だけが描画されタップで閉じてしまう（リザルトからの修正など）。
   * ペイント前に同期する。
   */
  useLayoutEffect(() => {
    if (visible) {
      setLayersVisible(true);
      setExitingUi(false);
      closeAnimLockRef.current = false;
      if (closeAnimTimerRef.current) {
        clearTimeout(closeAnimTimerRef.current);
        closeAnimTimerRef.current = null;
      }
      return;
    }
    // 送信成功など親が即 visible=false — 透明 Modal がタッチを吸い続けるのを防ぐ
    setLayersVisible(false);
    setExitingUi(false);
    closeAnimLockRef.current = false;
    if (closeAnimTimerRef.current) {
      clearTimeout(closeAnimTimerRef.current);
      closeAnimTimerRef.current = null;
    }
    Keyboard.dismiss();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (isEditingPrediction && !expandScoreFormWhenEditing) {
      setScoreFormExpanded(false);
    } else {
      setScoreFormExpanded(true);
    }
  }, [visible, isEditingPrediction, expandScoreFormWhenEditing]);

  useEffect(
    () => () => {
      if (closeAnimTimerRef.current) {
        clearTimeout(closeAnimTimerRef.current);
        closeAnimTimerRef.current = null;
      }
    },
    []
  );

  /** 試合開始後かつ自分の投稿あり: 要約のみ（修正不可） */
  const editingLockedAfterKickoff =
    predictionEditLockedAfterKickoff && isEditingPrediction;
  const showPredictionSummary =
    !spectatorStartedNoPost &&
    (editingLockedAfterKickoff ||
      (isEditingPrediction && !scoreFormExpanded));
  /** Web オーバーレイ：予想済みは MatchCard 中央に統合し、下の要約カードは出さない */
  const showMergedPredictionInPreview = showPredictionSummary;
  const gameStatus = overlayMarketBar?.status ?? "scheduled";
  const showMergedFinalInPreview =
    showMergedPredictionInPreview && gameStatus === "final" && mergedFinalPreview != null;
  const showMergedScheduledInPreview =
    showMergedPredictionInPreview &&
    gameStatus === "scheduled" &&
    mergedFinalPreview == null;
  const mergedPredictionForPreview = useMemo(() => {
    if (!showMergedScheduledInPreview) return null;
    const homeRaw = scoreHome.trim();
    const awayRaw = scoreAway.trim();
    if (homeRaw === "" || awayRaw === "") return null;
    const home = Number(homeRaw);
    const away = Number(awayRaw);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      return null;
    }
    return { home, away };
  }, [showMergedScheduledInPreview, scoreHome, scoreAway]);
  const isWcLeague = predictData?.league === "wc";
  const showWcMatchPreview = Boolean(
    isWcLeague && predictData?.gameId && hasWcMatchPreview(predictData.gameId)
  );
  const hideMarketTab = Boolean(overlayMarketBar);
  /** 開始前のみ Insight / Injury / Stats / Roster（BDL 系。legacy teams/{id} は使わない） */
  const showNbaPredictTimingOverlay =
    predictData?.league === "nba" &&
    !isWcLeague &&
    gameStatus === "scheduled";
  /** ライブ／終了は試合スタッツ画面 */
  const showNbaLiveGameStats =
    predictData?.league === "nba" &&
    !isWcLeague &&
    (gameStatus === "live" || gameStatus === "final");
  const liveStatsGameId = showNbaLiveGameStats
    ? predictData?.gameId ?? null
    : null;
  const { report: liveStatsReport, loading: liveStatsLoading } = useLiveGameStats(
    liveStatsGameId,
    showNbaLiveGameStats,
    { apiBaseUrl: getUniterzApiBaseUrl() }
  );
  /** Web 同様モックには落とさない（実在しない選手を賭け対象にしない） */
  const nbaTopScorerCandidates = useMemo(
    () =>
      normalizeNbaTopScorerCandidates(
        predictData?.subjectGame?.topScorerCandidates
      ),
    [predictData?.subjectGame]
  );
  const showWcOverlayTabs = isWcLeague && hideMarketTab;
  const overlayCenterMode = hideMarketTab;
  const showOverlayScheduleMeta =
    overlayCenterMode &&
    overlayMarketBar?.status === "scheduled" &&
    predictScheduleMeta != null &&
    !showMergedFinalInPreview;

  const predictedScoreForGoalScorer = useMemo(() => {
    const homeRaw = scoreHome.trim();
    const awayRaw = scoreAway.trim();
    if (homeRaw === "" || awayRaw === "") return null;
    const home = Number(homeRaw);
    const away = Number(awayRaw);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      return null;
    }
    return { home, away };
  }, [scoreHome, scoreAway]);

  useEffect(() => {
    if (hideMarketTab && predictToolsTab === "market") {
      setPredictToolsTab(null);
    }
  }, [hideMarketTab, predictToolsTab, setPredictToolsTab]);

  useEffect(() => {
    if (!showWcMatchPreview && predictToolsTab === "preview") {
      setPredictToolsTab(null);
    }
  }, [showWcMatchPreview, predictToolsTab, setPredictToolsTab]);

  useEffect(() => {
    if (!showNbaPredictTimingOverlay) return;
    if (
      predictToolsTab === "h2h" ||
      predictToolsTab === "market" ||
      predictToolsTab === "preview" ||
      predictToolsTab === "results" ||
      predictToolsTab === "standings"
    ) {
      setPredictToolsTab(null);
    }
  }, [showNbaPredictTimingOverlay, predictToolsTab, setPredictToolsTab]);

  const showScoreInputBlock =
    !spectatorStartedNoPost &&
    !editingLockedAfterKickoff &&
    (!isEditingPrediction || scoreFormExpanded);
  const canSubmit =
    showScoreInputBlock &&
    !predictSubmitting &&
    scoreHome !== "" &&
    scoreAway !== "" &&
    (() => {
      const homeNum = Number(scoreHome);
      const awayNum = Number(scoreAway);
      if (!Number.isFinite(homeNum) || !Number.isFinite(awayNum)) return false;
      const effectiveWinner =
        winner ??
        (homeNum > awayNum
          ? "home"
          : awayNum > homeNum
            ? "away"
            : isSoccerPredict
              ? "draw"
              : isKnockoutPredict
                ? pkWinner
                : null);
      if (!effectiveWinner) return false;
      if (
        isKnockoutPredict &&
        homeNum === awayNum &&
        pkWinner == null
      ) {
        return false;
      }
      return true;
    })();

  const modalChromeVisible = visible || exitingUi;

  /** ×・背景タップ・Android 戻る：閉じるアニメ後に親へ通知（親が即 visible=false にしないため exitingUi でモーダルを維持） */
  function scheduleCloseAfterExitAnimation() {
    if (closeAnimLockRef.current) return;
    if (reduceMotion) {
      onClose();
      return;
    }
    closeAnimLockRef.current = true;
    setExitingUi(true);
    setLayersVisible(false);
    if (closeAnimTimerRef.current) clearTimeout(closeAnimTimerRef.current);
    closeAnimTimerRef.current = setTimeout(() => {
      closeAnimTimerRef.current = null;
      closeAnimLockRef.current = false;
      onClose();
      setExitingUi(false);
    }, PREDICT_MODAL_EXIT_COMPLETION_MS);
  }

  return (
    <Modal
      visible={modalChromeVisible}
      transparent
      animationType="none"
      onRequestClose={scheduleCloseAfterExitAnimation}
    >
      {modalChromeVisible ? (
        <View
          style={s.root}
          key="predict-modal-mounted"
          pointerEvents={layersVisible ? "auto" : "none"}
        >
          {layersVisible ? (
            <>
          <Animated.View
            entering={backdropEnter}
            exiting={backdropExit}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="box-none"
          >
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                intensity={Platform.OS === "ios" ? 28 : 22}
                tint="dark"
                {...nativeBlurViewExtraProps()}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={s.backdropDim} pointerEvents="none" />
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={scheduleCloseAfterExitAnimation}
              accessibilityRole="button"
            />
          </Animated.View>
          <Animated.View
            entering={sheetEnter}
            exiting={sheetExit}
            style={s.modalSheetWrap}
            pointerEvents="box-none"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                s.kav,
                {
                  /** ×・REGULAR SEASON がノッチ/ステータスバーに食い込まない */
                  paddingTop: Math.max(spacing.md, insets.top),
                },
              ]}
              pointerEvents="box-none"
            >
              <ScrollView
                ref={predictScrollRef}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
                style={s.scroll}
                pointerEvents="auto"
                scrollEventThrottle={16}
                scrollEnabled={tutorialUserScrollEnabled}
                bounces={tutorialUserScrollEnabled}
                nestedScrollEnabled={tutorialUserScrollEnabled}
                onScroll={(e) => {
                  predictScrollYRef.current = e.nativeEvent.contentOffset.y;
                }}
              >
                <View style={s.modalContent}>
                  <PredictModalContentShell
                    unified={overlayUnifiedForm}
                  >
                  {matchPreview ? (
                    <Animated.View entering={previewEnter} collapsable={false}>
                      <PredictMatchPreview
                        data={matchPreview}
                        onClose={scheduleCloseAfterExitAnimation}
                        closeLabel={t.close}
                        overlayMarketBar={overlayMarketBar}
                        language={language}
                        t={t}
                        mergedPrediction={mergedPredictionForPreview}
                        mergedFinal={
                          showMergedFinalInPreview ? mergedFinalPreview : null
                        }
                        scheduleMeta={
                          showOverlayScheduleMeta ? predictScheduleMeta : null
                        }
                        wcGoalScorer={
                          showMergedScheduledInPreview ? wcGoalScorerPreview : null
                        }
                        isWcLeague={isWcLeague}
                        tutorialMode={tutorialMode}
                        overlayCenterMode={overlayCenterMode}
                        showEditButton={
                          showMergedScheduledInPreview && !editingLockedAfterKickoff
                        }
                        onEditPrediction={() => setScoreFormExpanded(true)}
                        overlayUnifiedForm={overlayUnifiedForm}
                        hideCloseButton
                        myPostId={myPostId}
                      />
                    </Animated.View>
                  ) : null}
                  {showNbaLiveGameStats ? (
                    liveStatsReport ? (
                      <LiveGameStatsPanelNative
                        report={liveStatsReport}
                        language={language === "en" ? "en" : "ja"}
                        omitScoreHeader
                      />
                    ) : (
                      <LiveGameStatsPlaceholderNative
                        language={language === "en" ? "en" : "ja"}
                        loading={liveStatsLoading}
                      />
                    )
                  ) : showNbaPredictTimingOverlay ? (
                    <NbaPredictToolsTabsNative
                      language={language}
                      isPro={isProUser}
                      homeTeamId={
                        rawTeamIdFromGameSide(matchPreview?.homeSide) ?? ""
                      }
                      awayTeamId={
                        rawTeamIdFromGameSide(matchPreview?.awaySide) ?? ""
                      }
                      homeTeamName={
                        predictHomeTeamLabel || matchPreview?.homeCompact || "HOME"
                      }
                      awayTeamName={
                        predictAwayTeamLabel || matchPreview?.awayCompact || "AWAY"
                      }
                      onOpenTeamDetail={onOpenTeamDetail}
                      onOpenPlayerDetail={onOpenPlayerDetail}
                    />
                  ) : (
              <View>
                <PredictOverlayChamferedFrameNative
                  cut={PREDICT_OVERLAY_CYBER_DECK_CUT}
                  gradientColors={["rgba(4,8,14,0.9)", "rgba(4,8,14,0.9)"]}
                  borderColor="rgba(0,245,255,0.28)"
                  shadowColor="#00f5ff"
                  shadowOpacity={0.06}
                  shadowRadius={18}
                  style={s.predictCyberDeckFrame}
                  contentStyle={s.predictCyberDeck}
                >
                {showWcOverlayTabs ? (
                  <>
                    <PredictOverlayCyberDeckTabNative
                      label={t.teamProfile}
                      active={predictToolsTab === "stats"}
                      onPress={() => handleToolTabPress("stats")}
                      edge="first"
                    />
                    {showWcMatchPreview ? (
                      <PredictOverlayCyberDeckTabNative
                        label={t.matchPreview}
                        active={predictToolsTab === "preview"}
                        onPress={() => handleToolTabPress("preview")}
                        edge="middle"
                      />
                    ) : null}
                    <PredictOverlayCyberDeckTabNative
                      label={t.pastResults}
                      active={predictToolsTab === "results"}
                      onPress={() => handleToolTabPress("results")}
                      edge="middle"
                    />
                    <PredictOverlayCyberDeckTabNative
                      label={t.groupStandings}
                      active={predictToolsTab === "standings"}
                      onPress={() => handleToolTabPress("standings")}
                      edge="last"
                      isLast
                    />
                  </>
                ) : (
                  <>
                    <PredictOverlayCyberDeckTabNative
                      label={t.tabH2h}
                      active={predictToolsTab === "h2h"}
                      onPress={() => handleToolTabPress("h2h")}
                      edge="first"
                    />
                    {!hideMarketTab ? (
                      <PredictOverlayCyberDeckTabNative
                        label={t.tabMarket}
                        active={predictToolsTab === "market"}
                        onPress={() => handleToolTabPress("market")}
                        edge="middle"
                      />
                    ) : null}
                    <PredictOverlayCyberDeckTabNative
                      label={t.tabStats}
                      active={predictToolsTab === "stats"}
                      onPress={() => handleToolTabPress("stats")}
                      edge="last"
                      isLast
                    />
                  </>
                )}
                </PredictOverlayChamferedFrameNative>
              </View>
                  )}

              {!showNbaPredictTimingOverlay &&
              !showNbaLiveGameStats &&
              predictToolsTab ? (
                <Animated.View
                  key={`predict-tool-${predictToolsTab}`}
                  entering={toolPanelIn}
                >
                  <GlassPanel variant="tool" showGrid={false}>
                    {predictToolsTab === "stats" && showWcOverlayTabs ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.teamProfile}</Text>
                        <View style={s.predictToolsPanelBody}>
                        {predictData ? (
                          <WcTeamProfilePanelNative
                            homeTeamId={
                              rawTeamIdFromGameSide(predictData.subjectGame.home) ?? ""
                            }
                            awayTeamId={
                              rawTeamIdFromGameSide(predictData.subjectGame.away) ?? ""
                            }
                            homeName={predictHomeTeamLabel}
                            awayName={predictAwayTeamLabel}
                            language={language}
                            t={t}
                            gameId={predictData.gameId}
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                        </View>
                      </>
                    ) : predictToolsTab === "preview" && showWcMatchPreview ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.matchPreview}</Text>
                        <View style={s.predictToolsPanelBody}>
                        {predictData ? (
                          <WcMatchPreviewPanelNative
                            gameId={predictData.gameId}
                            language={language}
                            t={t}
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                        </View>
                      </>
                    ) : predictToolsTab === "results" && showWcOverlayTabs ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.pastResults}</Text>
                        <View style={s.predictToolsPanelBody}>
                        {predictData ? (
                          <WcPastResultsPanelNative
                            homeTeamId={
                              rawTeamIdFromGameSide(predictData.subjectGame.home) ?? ""
                            }
                            awayTeamId={
                              rawTeamIdFromGameSide(predictData.subjectGame.away) ?? ""
                            }
                            currentGameId={predictData.gameId}
                            language={language}
                            t={t}
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                        </View>
                      </>
                    ) : predictToolsTab === "standings" && showWcOverlayTabs ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.groupStandings}</Text>
                        <View style={s.predictToolsPanelBody}>
                        {predictData ? (
                          <WcStandingPanelNative
                            homeTeamId={
                              rawTeamIdFromGameSide(predictData.subjectGame.home) ?? ""
                            }
                            awayTeamId={
                              rawTeamIdFromGameSide(predictData.subjectGame.away) ?? ""
                            }
                            language={language}
                            t={t}
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                        </View>
                      </>
                    ) : (
                      <>
                        {predictToolsTab === "stats" ? (
                          <>
                            <Text style={s.predictToolsPanelKicker}>{t.tabStats}</Text>
                            <View style={s.predictToolsPanelDivider} />
                          </>
                        ) : null}
                        {predictData && matchPreview ? (
                          <PredictToolTabContent
                            tab={
                              predictToolsTab === "preview" ||
                              predictToolsTab === "results" ||
                              predictToolsTab === "standings" ||
                              predictToolsTab === "injuries" ||
                              predictToolsTab === "roster"
                                ? "stats"
                                : predictToolsTab === "h2h" ||
                                    predictToolsTab === "market" ||
                                    predictToolsTab === "stats"
                                  ? predictToolsTab
                                  : "stats"
                            }
                            language={predictData.language}
                            t={t}
                            gameId={predictData.gameId}
                            league={predictData.league}
                            subjectGame={predictData.subjectGame}
                            peerGames={predictData.peerGames}
                            formatGameDateMs={predictData.formatGameDateMs}
                            homeColor={matchPreview.homePalette.primary}
                            awayColor={matchPreview.awayPalette.primary}
                            isSoccerLeague={predictData.isSoccerLeague}
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                      </>
                    )}
                  </GlassPanel>
                </Animated.View>
              ) : null}

              {!spectatorStartedNoPost ? (
                <>
                  {showPredictionSummary && !showMergedPredictionInPreview ? (
                    <View>
                      <GlassPanel variant="formCompact">
                        <Text style={s.predictSummaryKicker}>{t.myPrediction}</Text>
                        <View
                          style={[
                            s.predictSummaryPairBlock,
                            editingLockedAfterKickoff &&
                              s.predictSummaryPairBlockNoFooter,
                          ]}
                        >
                          <View style={s.predictSummaryNamesRow}>
                            <Text
                              style={s.predictSummaryTeamName}
                              numberOfLines={1}
                            >
                              {predictHomeTeamLabel || "HOME"}
                            </Text>
                            <View
                              style={s.predictSummaryMidGutter}
                              accessibilityElementsHidden
                              importantForAccessibility="no-hide-descendants"
                            />
                            <Text
                              style={s.predictSummaryTeamName}
                              numberOfLines={1}
                            >
                              {predictAwayTeamLabel || "AWAY"}
                            </Text>
                          </View>
                          <View style={s.predictSummaryScoresRow}>
                            <Text style={s.predictSummaryScoreValue}>
                              {scoreHome.trim() !== "" ? scoreHome : "–"}
                            </Text>
                            <View
                              style={s.predictSummaryMidSep}
                              accessibilityElementsHidden
                              importantForAccessibility="no-hide-descendants"
                            >
                              <Text style={s.predictSummaryMidDash}>—</Text>
                            </View>
                            <Text style={s.predictSummaryScoreValue}>
                              {scoreAway.trim() !== "" ? scoreAway : "–"}
                            </Text>
                          </View>
                        </View>
                        {!editingLockedAfterKickoff ? (
                          <Pressable
                            onPress={() => setScoreFormExpanded(true)}
                            style={({ pressed }) => [
                              s.predictSummaryEditBtn,
                              pressed && s.predictSummaryEditBtnPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={t.editScoresCta}
                          >
                            <Text style={s.predictSummaryEditBtnText}>
                              {t.editScoresCta}
                            </Text>
                          </Pressable>
                        ) : null}
                      </GlassPanel>
                    </View>
                  ) : null}

                  {showScoreInputBlock ? (
                    <>
                      <TutorialTargetNative id="predict-scores">
                      <Animated.View entering={scoreBlockEnter}>
                        {overlayUnifiedForm ? (
                          <View
                            style={[
                              s.predictScoreFormPanel,
                              tutorialMode
                                ? {
                                    borderColor: "rgba(0,245,255,0.4)",
                                    borderWidth: 1,
                                    shadowColor: TUTORIAL_CYAN,
                                    shadowOpacity: 0.25,
                                    shadowRadius: 12,
                                  }
                                : null,
                            ]}
                          >
                          <PredictionScoringRulesChipNative
                            language={language}
                            league={isWcLeague ? "wc" : "nba"}
                            accessibilityLabel={t.scoringRulesChip}
                            closeLabel={t.close}
                            rulesFootNote={t.rulesFootNote}
                          />
                          <Text
                            style={[
                              s.predictSectionTitle,
                              s.predictSectionTitleWithChip,
                            ]}
                          >
                            {t.scorePredictTitle}
                          </Text>
                          <View style={s.scoreGrid}>
                            <View style={s.scoreCol}>
                              <Text style={s.teamNameLabel} numberOfLines={1}>
                                {predictHomeTeamLabel || "HOME"}
                              </Text>
                              <TutorialTargetNative id="predict-score-home">
                                <PredictOverlayScoreInputNative
                                  tutorialFocusId="home"
                                  value={scoreHome}
                                  onChangeText={setScoreHome}
                                  placeholder={t.scoreFieldPlaceholder}
                                />
                              </TutorialTargetNative>
                            </View>
                            <View style={s.scoreCol}>
                              <Text style={s.teamNameLabel} numberOfLines={1}>
                                {predictAwayTeamLabel || "AWAY"}
                              </Text>
                              <TutorialTargetNative id="predict-score-away">
                                <PredictOverlayScoreInputNative
                                  tutorialFocusId="away"
                                  value={scoreAway}
                                  onChangeText={setScoreAway}
                                  placeholder={t.scoreFieldPlaceholder}
                                />
                              </TutorialTargetNative>
                            </View>
                          </View>
                          {isKnockoutPredict &&
                          predictedScoreForGoalScorer &&
                          predictedScoreForGoalScorer.home ===
                            predictedScoreForGoalScorer.away &&
                          setPkWinner ? (
                            <View style={s.pkAdvanceBlock}>
                              <Text style={s.pkAdvanceTitle}>
                                {language === "en"
                                  ? "Who advances on penalties?"
                                  : "PK戦で勝ち上がるチーム"}
                              </Text>
                              <View style={s.pkAdvanceRow}>
                                {(
                                  [
                                    {
                                      side: "home" as const,
                                      label: predictHomeTeamLabel || "HOME",
                                      teamId: rawTeamIdFromGameSide(
                                        matchPreview?.homeSide
                                      ),
                                    },
                                    {
                                      side: "away" as const,
                                      label: predictAwayTeamLabel || "AWAY",
                                      teamId: rawTeamIdFromGameSide(
                                        matchPreview?.awaySide
                                      ),
                                    },
                                  ] as const
                                ).map(({ side, label, teamId }) => {
                                  const active = pkWinner === side;
                                  return (
                                    <Pressable
                                      key={side}
                                      onPress={() => setPkWinner(side)}
                                      style={[
                                        s.pkAdvanceChip,
                                        active ? s.pkAdvanceChipActive : null,
                                      ]}
                                      accessibilityRole="button"
                                      accessibilityState={{ selected: active }}
                                      accessibilityLabel={label}
                                    >
                                      {teamId ? (
                                        <CountryFlagNative
                                          teamId={teamId}
                                          variant="inline"
                                        />
                                      ) : (
                                        <Text
                                          style={[
                                            s.pkAdvanceChipText,
                                            active
                                              ? s.pkAdvanceChipTextActive
                                              : null,
                                          ]}
                                          numberOfLines={1}
                                        >
                                          {label}
                                        </Text>
                                      )}
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </View>
                          ) : null}
                          {isWcLeague && setGoalScorerPick ? (
                            <WcGoalScorerPickerNative
                              homeTeamId={rawTeamIdFromGameSide(predictData?.subjectGame.home)}
                              awayTeamId={rawTeamIdFromGameSide(predictData?.subjectGame.away)}
                              homeLabel={predictHomeTeamLabel || "HOME"}
                              awayLabel={predictAwayTeamLabel || "AWAY"}
                              predictedScore={predictedScoreForGoalScorer}
                              value={
                                goalScorerPick &&
                                "playerId" in goalScorerPick
                                  ? (goalScorerPick as WcGoalScorerPick)
                                  : null
                              }
                              onChange={setGoalScorerPick}
                              language={language}
                              t={t}
                              gameId={predictData?.gameId}
                            />
                          ) : null}
                          {!isWcLeague &&
                          predictData?.league === "nba" &&
                          setGoalScorerPick ? (
                            <NbaTopScorerPickerNative
                              homeTeamId={
                                rawTeamIdFromGameSide(matchPreview?.homeSide) ??
                                rawTeamIdFromGameSide(
                                  predictData?.subjectGame?.home
                                )
                              }
                              awayTeamId={
                                rawTeamIdFromGameSide(matchPreview?.awaySide) ??
                                rawTeamIdFromGameSide(
                                  predictData?.subjectGame?.away
                                )
                              }
                              candidates={nbaTopScorerCandidates}
                              value={
                                goalScorerPick
                                  ? normalizeNbaTopScorerPick(goalScorerPick)
                                  : null
                              }
                              onChange={setGoalScorerPick}
                              language={language}
                            />
                          ) : null}
                          {isSoccerPredict && !isWcLeague ? (
                            <Text style={s.soccerHint}>{t.drawAvailable}</Text>
                          ) : null}
                          </View>
                        ) : (
                        <PredictOverlayCyberFormPanelNative>
                          <View style={s.predictScoreFormPanel}>
                          <PredictionScoringRulesChipNative
                            language={language}
                            league={isWcLeague ? "wc" : "nba"}
                            accessibilityLabel={t.scoringRulesChip}
                            closeLabel={t.close}
                            rulesFootNote={t.rulesFootNote}
                          />
                          <Text
                            style={[
                              s.predictSectionTitle,
                              s.predictSectionTitleWithChip,
                            ]}
                          >
                            {t.scorePredictTitle}
                          </Text>
                          <View style={s.scoreGrid}>
                            <View style={s.scoreCol}>
                              <Text style={s.teamNameLabel} numberOfLines={1}>
                                {predictHomeTeamLabel || "HOME"}
                              </Text>
                              <TutorialTargetNative id="predict-score-home">
                                <PredictOverlayScoreInputNative
                                  tutorialFocusId="home"
                                  value={scoreHome}
                                  onChangeText={setScoreHome}
                                  placeholder={t.scoreFieldPlaceholder}
                                />
                              </TutorialTargetNative>
                            </View>
                            <View style={s.scoreCol}>
                              <Text style={s.teamNameLabel} numberOfLines={1}>
                                {predictAwayTeamLabel || "AWAY"}
                              </Text>
                              <TutorialTargetNative id="predict-score-away">
                                <PredictOverlayScoreInputNative
                                  tutorialFocusId="away"
                                  value={scoreAway}
                                  onChangeText={setScoreAway}
                                  placeholder={t.scoreFieldPlaceholder}
                                />
                              </TutorialTargetNative>
                            </View>
                          </View>
                          {isKnockoutPredict &&
                          predictedScoreForGoalScorer &&
                          predictedScoreForGoalScorer.home ===
                            predictedScoreForGoalScorer.away &&
                          setPkWinner ? (
                            <View style={s.pkAdvanceBlock}>
                              <Text style={s.pkAdvanceTitle}>
                                {language === "en"
                                  ? "Who advances on penalties?"
                                  : "PK戦で勝ち上がるチーム"}
                              </Text>
                              <View style={s.pkAdvanceRow}>
                                {(
                                  [
                                    {
                                      side: "home" as const,
                                      label: predictHomeTeamLabel || "HOME",
                                      teamId: rawTeamIdFromGameSide(
                                        matchPreview?.homeSide
                                      ),
                                    },
                                    {
                                      side: "away" as const,
                                      label: predictAwayTeamLabel || "AWAY",
                                      teamId: rawTeamIdFromGameSide(
                                        matchPreview?.awaySide
                                      ),
                                    },
                                  ] as const
                                ).map(({ side, label, teamId }) => {
                                  const active = pkWinner === side;
                                  return (
                                    <Pressable
                                      key={side}
                                      onPress={() => setPkWinner(side)}
                                      style={[
                                        s.pkAdvanceChip,
                                        active ? s.pkAdvanceChipActive : null,
                                      ]}
                                      accessibilityRole="button"
                                      accessibilityState={{ selected: active }}
                                      accessibilityLabel={label}
                                    >
                                      {teamId ? (
                                        <CountryFlagNative
                                          teamId={teamId}
                                          variant="inline"
                                        />
                                      ) : (
                                        <Text
                                          style={[
                                            s.pkAdvanceChipText,
                                            active
                                              ? s.pkAdvanceChipTextActive
                                              : null,
                                          ]}
                                          numberOfLines={1}
                                        >
                                          {label}
                                        </Text>
                                      )}
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </View>
                          ) : null}
                          {isWcLeague && setGoalScorerPick ? (
                            <WcGoalScorerPickerNative
                              homeTeamId={rawTeamIdFromGameSide(predictData?.subjectGame.home)}
                              awayTeamId={rawTeamIdFromGameSide(predictData?.subjectGame.away)}
                              homeLabel={predictHomeTeamLabel || "HOME"}
                              awayLabel={predictAwayTeamLabel || "AWAY"}
                              predictedScore={predictedScoreForGoalScorer}
                              value={
                                goalScorerPick &&
                                "playerId" in goalScorerPick
                                  ? (goalScorerPick as WcGoalScorerPick)
                                  : null
                              }
                              onChange={setGoalScorerPick}
                              language={language}
                              t={t}
                              gameId={predictData?.gameId}
                            />
                          ) : null}
                          {!isWcLeague &&
                          predictData?.league === "nba" &&
                          setGoalScorerPick ? (
                            <NbaTopScorerPickerNative
                              homeTeamId={
                                rawTeamIdFromGameSide(matchPreview?.homeSide) ??
                                rawTeamIdFromGameSide(
                                  predictData?.subjectGame?.home
                                )
                              }
                              awayTeamId={
                                rawTeamIdFromGameSide(matchPreview?.awaySide) ??
                                rawTeamIdFromGameSide(
                                  predictData?.subjectGame?.away
                                )
                              }
                              candidates={nbaTopScorerCandidates}
                              value={
                                goalScorerPick
                                  ? normalizeNbaTopScorerPick(goalScorerPick)
                                  : null
                              }
                              onChange={setGoalScorerPick}
                              language={language}
                            />
                          ) : null}
                          {isSoccerPredict && !isWcLeague ? (
                            <Text style={s.soccerHint}>{t.drawAvailable}</Text>
                          ) : null}
                          </View>
                        </PredictOverlayCyberFormPanelNative>
                        )}
                      </Animated.View>
                      </TutorialTargetNative>

                      <TutorialTargetNative id="predict-submit">
                      <PredictOverlaySubmitButtonNative
                        enabled={canSubmit}
                        tutorialPulse={tutorialMode}
                        onPress={onSubmit}
                        label={
                          predictSubmitting
                            ? isEditingPrediction
                              ? t.updating
                              : t.posting
                            : isEditingPrediction
                              ? t.submitUpdate
                              : t.submitPrediction
                        }
                        disabledLabel={
                          isEditingPrediction ? t.submitUpdate : t.submitPrediction
                        }
                      />
                      </TutorialTargetNative>
                    </>
                  ) : null}
                </>
              ) : null}
                  </PredictModalContentShell>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
            {tutorialMode && !tutorialAnnotDismissed ? (
              <TutorialPredictAnnotatorNative
                open
                overviewTitle={tutorialMsgs.predictOverviewTitle}
                overviewBody={tutorialMsgs.predictOverviewBody}
                sidesTitle={tutorialMsgs.predictSidesTitle}
                sidesBody={tutorialMsgs.predictSidesBody}
                marketTitle={tutorialMsgs.predictMarketTitle}
                marketBody={tutorialMsgs.predictMarketBody}
                toolsTitle={tutorialMsgs.predictToolsTitle}
                toolsBody={tutorialMsgs.predictToolsBody}
                scoresTitle={tutorialMsgs.predictScoresTitle}
                scoresBody={tutorialMsgs.predictScoresBody}
                bonusTitle={tutorialMsgs.predictBonusTitle}
                bonusBody={tutorialMsgs.predictBonusBody}
                enterTitle={tutorialMsgs.predictEnterTitle}
                enterBody={tutorialMsgs.predictEnterBody}
                submitTitle={tutorialMsgs.predictSubmitTitle}
                submitBody={tutorialMsgs.predictSubmitBody}
                nextLabel={i18nT((language === "en" ? "en" : "ja") as Language).tutorial.next}
                skipLabel={i18nT((language === "en" ? "en" : "ja") as Language).tutorial.skip}
                backLabel={i18nT((language === "en" ? "en" : "ja") as Language).tutorial.back}
                enterWaitHint={tutorialMsgs.predictEnterWait}
                submitWaitHint={tutorialMsgs.predictSubmitWait}
                toolsWaitHint={tutorialMsgs.predictToolsWait}
                enterReady={
                  scoreHome !== "" &&
                  scoreAway !== "" &&
                  Number.isFinite(Number(scoreHome)) &&
                  Number.isFinite(Number(scoreAway))
                }
                onSkip={() => setTutorialAnnotDismissed(true)}
              />
            ) : null}
            <ProfileBackEdgeHandleNative
              onPress={scheduleCloseAfterExitAnimation}
              accessibilityLabel={language === "en" ? "Back" : "戻る"}
            />
            </>
          ) : null}
        </View>
      ) : null}
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** 下からスライドするシート全体（KeyboardAvoidingView の親） */
  modalSheetWrap: {
    flex: 1,
    zIndex: 1,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  kav: {
    flex: 1,
    zIndex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  scroll: {
    width: "100%",
    maxHeight: Platform.OS === "ios" ? "92%" : "94%",
  },
  scrollContent: {
    alignItems: "stretch",
    paddingVertical: spacing.xs,
  },
  /** プレビュー・タブ・フォーム・送信の縦積み（試合カード↔セグメントは詰める） */
  modalContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 8,
  },
  unifiedOverlayPanelContent: {
    position: "relative",
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 6,
  },
  predictCyberDeckFrame: {
    width: "100%",
  },
  predictCyberDeck: {
    flexDirection: "row",
    minHeight: 40,
    overflow: "hidden",
  },
  nbaTimingTabShell: {
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(4,8,14,0.72)",
  },
  /** モバイル: h-9, rounded-xl, text-xs, font-semibold, border + bg */
  predictToolTab: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.035)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  predictToolTabActive: {
    borderColor: "rgba(103,232,249,0.35)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  predictToolTabText: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  predictToolTabTextInactive: {
    color: "rgba(255,255,255,0.88)",
  },
  glassBase: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  /** glassCard: rounded-2xl, px-4 py-3 */
  glassOuterForm: {
    borderRadius: 16,
  },
  /** glassCardStatsPanel モバイル: rounded-xl, px-3 py-2.5 */
  glassOuterTool: {
    borderRadius: 12,
  },
  glassPanelTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  toolGridLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  toolGridVLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(148,163,184,0.14)",
  },
  toolGridHLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(148,163,184,0.14)",
  },
  glassPanelContentForm: {
    position: "relative",
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  /** 予想済み要約（試合終了後など）— 通常 form より縦を削る */
  glassPanelContentFormCompact: {
    position: "relative",
    zIndex: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  glassPanelContentTool: {
    position: "relative",
    zIndex: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  predictToolsPanelKicker: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "left",
    marginBottom: 8,
  },
  /** Web `border-t border-white/10 pt-2` */
  predictToolsPanelBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 8,
  },
  predictToolsPanelDivider: {
    height: 1,
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  predictToolsPanelSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "left",
  },
  predictSectionTitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  predictScoreFormPanel: {
    position: "relative",
    gap: 16,
  },
  predictSectionTitleWithChip: {
    paddingRight: 36,
  },
  /** 予想済み要約（あなたの予想 → チーム名行 → スコア「—」スコア → 修正） */
  predictSummaryKicker: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "left",
  },
  predictSummaryPairBlock: {
    marginBottom: 10,
    gap: 5,
  },
  /** キックオフ後ロックで修正ボタンなし — 下の空きを削る */
  predictSummaryPairBlockNoFooter: {
    marginBottom: 2,
  },
  predictSummaryNamesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  predictSummaryScoresRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  /** チーム名行の中央（スコア行の「—」と幅を揃える） */
  predictSummaryMidGutter: {
    width: 28,
    flexShrink: 0,
  },
  /** スコア行の中央の区切り */
  predictSummaryMidSep: {
    width: 28,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  predictSummaryMidDash: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  predictSummaryTeamName: {
    flex: 1,
    minWidth: 0,
    color: "#f8fafc",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "400",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    letterSpacing: 1.2,
    includeFontPadding: false,
    textTransform: "uppercase",
    textAlign: "center",
    transform: [{ skewX: "-6deg" }],
  },
  predictSummaryScoreValue: {
    flex: 1,
    minWidth: 0,
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
  },
  predictSummaryEditBtn: {
    alignSelf: "stretch",
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.85)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  predictSummaryEditBtnPressed: {
    opacity: 0.88,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
  },
  predictSummaryEditBtnText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  scoreGrid: {
    flexDirection: "row",
    gap: 12,
  },
  scoreCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  teamNameLabel: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "400",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    letterSpacing: 1.2,
    includeFontPadding: false,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  soccerHint: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(147,185,255,0.85)",
    textAlign: "center",
  },
  pkAdvanceBlock: {
    marginTop: 12,
    gap: 8,
  },
  pkAdvanceTitle: {
    color: "rgba(252,211,77,0.9)",
    fontSize: 13,
    fontWeight: "700",
  },
  pkAdvanceRow: {
    flexDirection: "row",
    gap: 10,
  },
  pkAdvanceChip: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  pkAdvanceChipActive: {
    borderColor: "rgba(252,211,77,0.7)",
    backgroundColor: "rgba(252,211,77,0.15)",
  },
  pkAdvanceChipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
  pkAdvanceChipTextActive: {
    color: "#fde68a",
  },
  /** バッジ・閉じるボタンは overflow:visible。内側 shell だけ clip */
  matchPreviewWrap: {
    position: "relative",
    width: "100%",
    overflow: "visible",
    marginTop: 0,
    marginBottom: 0,
  },
  /** ラウンド名・3 カラム（背景は `PredictOverlayMatchCardShellNative`） */
  matchPreviewPaddedContent: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 10,
  },
  matchPreviewMarketBarWrap: {
    marginTop: 4,
    paddingTop: 2,
    paddingBottom: 6,
  },
  /** Web overlay `text-xl` + `bracketMarketTeamTypography` */
  matchPreviewRoundPadded: {
    ...MATCH_CARD_BRACKET_TEXT,
    color: "rgba(241,245,255,0.95)",
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
    marginTop: 2,
    marginBottom: 2,
    paddingHorizontal: 40,
  },
  matchPreviewGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    position: "relative",
    gap: 6,
  },
  /** 左右列の幅差に依存せず、カード幅の真ん中に VS を置く */
  matchPreviewVsOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 18,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  matchPreviewVsBlock: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  matchPreviewMergedBlock: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    gap: 4,
    paddingTop: 2,
  },
  matchPreviewMergedKicker: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(103,232,249,0.8)",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  matchPreviewMergedScoreRow: {
    textAlign: "center",
  },
  matchPreviewMergedScoreNum: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    color: "#ecfeff",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(34,211,238,0.38)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  matchPreviewMergedScoreDash: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    color: "rgba(255,255,255,0.9)",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
  },
  matchPreviewScheduleMeta: {
    marginTop: 6,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  /** Web `gap-x-3 gap-y-1 items-center justify-center text-center` */
  matchPreviewScheduleMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "center",
    alignSelf: "stretch",
    width: "100%",
    rowGap: 4,
  },
  /** Web `inline-flex items-baseline gap-1.5` */
  matchPreviewScheduleMetaGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    flexShrink: 0,
    gap: 6,
  },
  matchPreviewScheduleMetaGroupAfter: {
    marginRight: 12,
  },
  matchPreviewScheduleMetaLabel: {
    ...MATCH_CARD_BRACKET_TEXT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
  },
  matchPreviewScheduleMetaValue: {
    ...MATCH_CARD_BRACKET_TEXT,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    fontVariant: ["tabular-nums"],
  },
  matchPreviewGoalScorerWrap: {
    marginTop: 4,
    paddingBottom: 2,
  },
  matchPreviewGoalScorerDivider: {
    height: 1,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  matchPreviewOutcomeBadge: {
    position: "absolute",
    right: 8,
    /** カード内 paddingTop と揃え、上端で見切れない */
    top: 8,
    zIndex: 20,
    flexShrink: 0,
  },
  matchPreviewFinalBlock: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    gap: 2,
    paddingTop: 0,
  },
  matchPreviewOverlayPredictRow: {
    marginTop: 0,
    textAlign: "center",
  },
  matchPreviewOverlayPredictKicker: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
  matchPreviewPkRow: {
    marginTop: 1,
    textAlign: "center",
  },
  matchPreviewPkLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(251,191,36,0.85)",
  },
  matchPreviewPkNum: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    color: "rgba(251,191,36,0.95)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(251,191,36,0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  matchPreviewPkDash: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    color: "rgba(251,191,36,0.8)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  matchPreviewOverlayPredictNum: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    color: "rgba(251,191,36,0.95)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(251,191,36,0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  matchPreviewOverlayPredictDash: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    color: "rgba(251,191,36,0.8)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  matchPreviewStatBlock: {
    marginTop: 2,
    gap: 10,
    paddingBottom: 8,
  },
  matchPreviewStatHairline: {
    height: 1,
    width: "100%",
    marginBottom: 2,
    backgroundColor: "rgba(255,255,255,0.16)",
    opacity: 0.85,
  },
  matchPreviewStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: OVERLAY_RESULT_STAT_ROW_GAP,
    paddingVertical: 6,
  },
  matchPreviewStatLabel: {
    width: OVERLAY_RESULT_STAT_LABEL_W,
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.96)",
  },
  matchPreviewStatBarSlot: {
    flex: 1,
    minWidth: 0,
  },
  matchPreviewStatValue: {
    width: OVERLAY_RESULT_STAT_VALUE_W,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.92)",
    fontVariant: ["tabular-nums"],
  },
  matchPreviewStatValueYellow: {
    color: "rgba(253,224,71,0.95)",
  },
  matchPreviewStatValueRed: {
    color: "rgba(251,113,133,0.95)",
  },
  matchPreviewVsText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.35,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  /** Web `matchVsLabelClass`（Montserrat Black Italic） */
  matchPreviewVsLabel: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: 1.44,
    textTransform: "uppercase",
    color: "rgba(236,254,255,0.95)",
    textAlign: "center",
    includeFontPadding: false,
    textShadowColor: "rgba(34,211,238,0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  /** Web `LiveMatchMark` 相当（プレビュー中央・一覧よりひとまわり小さめ） */
  matchPreviewLivePill: liveMarkPillCyberBase,
  matchPreviewLivePillText: liveMarkTextCyberBase,
  /** `PlayoffSeriesScoreInline` を包む（旧シリーズ行 Text 相当） */
  matchPreviewSeriesRow: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  matchPreviewCol: {
    flex: 1,
    minWidth: 0,
    minHeight: 84,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
  },
  /** Web `MatchCard` の HOME/AWAY: `text-xs font-bold uppercase opacity-85` + `bracketMarketTeamTypography` */
  matchPreviewSideTag: {
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 12,
    lineHeight: 14,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
  },
  matchPreviewJersey: { marginTop: 2, marginBottom: 2 },
  /** Web WC overlay `wcTeamNameFont`（Bebas + letter-spacing 補正） */
  matchPreviewTeamName: {
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 1.04,
    paddingRight: 1.04,
    color: colors.textPrimary,
    textTransform: "uppercase",
    textAlign: "center",
    textShadowColor: "rgba(255,255,255,0.18)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
    transform: [{ skewX: "-6deg" }],
  },
  /** Web WC mobile overlay `text-[15px]` */
  matchPreviewTeamNameWc: {
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
    paddingRight: MATCH_CARD_BRACKET_LETTER_SPACING_15,
    paddingTop: 2,
  },
  /** Web WC overlay — 国名・試合時間と同じ Bebas */
  matchPreviewRecordBracket: {
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 0.88,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  /** 非 WC 戦績 */
  matchPreviewRecord: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    lineHeight: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  matchPreviewCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingTop: 18,
  },
  /** Web overlay 試合終了: 国旗列とのバランス — やや下げて GROUP D との間を確保 */
  matchPreviewCenterFinal: {
    paddingTop: 24,
  },
  matchPreviewScoreRow: { textAlign: "center" },
  matchPreviewScoreNum: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  matchPreviewScoreDash: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    color: "rgba(255,255,255,0.7)",
  },
  matchPreviewSub: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  matchPreviewPkSub: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 9,
    lineHeight: 12,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
    marginTop: 1,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  matchPreviewSeries: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    marginTop: 2,
    color: "rgba(200,220,255,0.7)",
  },
});
