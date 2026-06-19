import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../../theme/tokens";
import {
  MOBILE_RESULT_STAT_LABEL_W,
  MOBILE_RESULT_STAT_ROW_GAP,
  MOBILE_RESULT_STAT_VALUE_W,
} from "../results/resultMobileUiNative";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import MatchCardOverlayMarketBarNative from "./MatchCardOverlayMarketBarNative";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import { PredictToolTabContent } from "./PredictToolTabContent";
import type { NativeGameRow, SupportedLeague } from "./useTodayGames";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import MatchTeamMarkNative from "./MatchTeamMarkNative";
import { LiveMarkPill } from "./LiveMarkPill";
import {
  liveMarkPillCyberBase,
  liveMarkTextCyberBase,
} from "../../ui/liveMarkCyberStyles";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import WcGoalScorerResultRowNative from "../results/WcGoalScorerResultRowNative";
import ResultOutcomeBadgesNative from "../results/ResultOutcomeBadgesNative";
import ResultStatRatingBarNative from "../results/ResultStatRatingBarNative";
import WcTeamFlagWithMetaNative from "../results/WcTeamFlagWithMetaNative";
import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";
import WcGoalScorerPickerNative from "./wc/WcGoalScorerPickerNative";
import WcMatchPreviewPanelNative from "./wc/WcMatchPreviewPanelNative";
import WcStandingPanelNative from "./wc/WcStandingPanelNative";
import WcTeamProfilePanelNative from "./wc/WcTeamProfilePanelNative";
import type { WcGoalScorerPick } from "../../../../../lib/wc/goalScorer";
import { hasWcMatchPreview } from "../../../../../lib/wc/matchPreviews";
import type { PredictModalMergedFinalPreview } from "./buildPredictModalMergedFinal";
import {
  MODAL_PREVIEW_GRID_LAYER_OPACITY,
  MODAL_PREVIEW_GRID_LINE_COLOR,
  shellGridHorizontalLineTopsCentered,
  shellGridVerticalLineLeftsCentered,
} from "./matchCardShellGrid";
import {
  PREDICT_MODAL_EXIT_COMPLETION_MS,
  predictBlockFadeUpEnter,
  predictModalBackdropEnter,
  predictModalBackdropExit,
  predictModalPreviewEnter,
  predictModalSheetEnter,
  predictModalSheetExit,
  predictPanelRevealEnter,
} from "./predictMotion";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "./matchCardTypography";

/** #RRGGBB → rgba（カラー帯用） */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  return `rgba(255,255,255,${alpha})`;
}

/** Web `scoreInputClass` の `resultStatsMetricNumClass`（Oxanium）に相当 */
const SCORE_INPUT_FONT = MATCH_CARD_METRIC_FONT;

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

/** 一覧カードと同じ: 中央基準の 24px 方眼 */
function MatchPreviewGridOverlay() {
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const verticalLineLeftPx = useMemo(
    () => shellGridVerticalLineLeftsCentered(gridSize.width),
    [gridSize.width]
  );
  const horizontalLineTopsPx = useMemo(
    () => shellGridHorizontalLineTopsCentered(gridSize.height),
    [gridSize.height]
  );
  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (
      Math.abs(width - gridSize.width) < 0.5 &&
      Math.abs(height - gridSize.height) < 0.5
    ) {
      return;
    }
    setGridSize({ width, height });
  }
  return (
    <View pointerEvents="none" style={s.previewGridOverlay} onLayout={handleLayout}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity: MODAL_PREVIEW_GRID_LAYER_OPACITY }]}
      >
        {verticalLineLeftPx.map((leftPx) => (
          <View
            key={`v-${leftPx}`}
            style={[
              s.previewGridLineV,
              { left: leftPx, backgroundColor: MODAL_PREVIEW_GRID_LINE_COLOR },
            ]}
          />
        ))}
        {horizontalLineTopsPx.map((topPx) => (
          <View
            key={`h-${topPx}`}
            style={[
              s.previewGridLineH,
              { top: topPx, backgroundColor: MODAL_PREVIEW_GRID_LINE_COLOR },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function PredictMatchPreview({
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
}) {
  const { centerBlock, seriesPair } = data;
  const homeC = data.homePalette.primary;
  const awayC = data.awayPalette.primary;
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
  return (
    <View style={s.matchPreviewShell}>
      {/** 一覧 `cardGridUnderlay` と同型: 方眼は最下層。 */}
      <View pointerEvents="none" style={s.matchPreviewGridUnderlay}>
        <MatchPreviewGridOverlay />
      </View>
      {/** シェルに `padding` を付けると、絶対配置の方眼だけ余白に回り背景グラデに届かない（グリットだけ濃い枠に見える）。全面グラデ＋内側のパディング専用 View。 */}
      <View pointerEvents="none" style={s.matchPreviewGradientPlatter}>
        {/** 一覧 `GameCardList` の `cardLayerBase` と同一（0.96 だと方眼が透けにくく薄く見える） */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(14,18,28,0.92)",
            "rgba(10,13,22,0.86)",
            "rgba(7,10,17,0.92)",
          ]}
          locations={[0, 0.52, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={[
              hexToRgba(homeC, 0.4),
              hexToRgba(homeC, 0.12),
              "rgba(0,0,0,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.75, y: 0.5 }}
            style={s.matchPreviewBiasLeft}
          />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0)",
              hexToRgba(awayC, 0.12),
              hexToRgba(awayC, 0.4),
            ]}
            start={{ x: 0.25, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={s.matchPreviewBiasRight}
          />
        </View>
        {/** 一覧試合カードと同じ白の薄い層で方眼のコントラストを抑える */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.018)",
            "rgba(255,255,255,0.004)",
            "rgba(255,255,255,0)",
          ]}
          locations={[0, 0.24, 1]}
          style={s.matchPreviewLayerTopGlow}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.018)",
            "rgba(255,255,255,0.008)",
            "rgba(255,255,255,0)",
          ]}
          locations={[0, 0.6, 1]}
          style={s.matchPreviewLayerGlassFog}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.012)",
            "rgba(255,255,255,0.003)",
            "rgba(255,255,255,0)",
          ]}
          locations={[0, 0.2, 1]}
          style={s.matchPreviewLayerShine}
        />
        <View pointerEvents="none" style={s.matchPreviewGlowOverlay} />
      </View>
      {mergedFinal?.badge || mergedFinal?.streakBadge ? (
        <View pointerEvents="none" style={s.matchPreviewOutcomeBadge}>
          <ResultOutcomeBadgesNative
            badge={mergedFinal.badge}
            streakBadge={mergedFinal.streakBadge}
            activeWinStreak={mergedFinal.activeWinStreak}
          />
        </View>
      ) : null}
      <View pointerEvents="box-none" style={s.matchPreviewPaddedContent}>
        {data.roundLabel ? (
          <Text style={s.matchPreviewRoundPadded} numberOfLines={1}>
            {data.roundLabel}
          </Text>
        ) : null}
        <View style={s.matchPreviewGrid}>
          <View style={s.matchPreviewCol}>
            {!isWcLeague ? (
              <Text style={s.matchPreviewSideTag}>HOME</Text>
            ) : null}
            <View style={s.matchPreviewJersey}>
              <WcTeamFlagWithMetaNative teamId={isWcLeague ? homeTeamId : null}>
                <MatchTeamMarkNative
                  leagueRaw={data.leagueRaw}
                  side={data.homeSide}
                  palette={data.homePalette}
                  jerseySize={48}
                  flagVariant="preview"
                />
              </WcTeamFlagWithMetaNative>
            </View>
            <Text style={s.matchPreviewTeamName} numberOfLines={2}>
              {data.homeCompact}
            </Text>
            {data.homeRecord ? (
              <Text style={s.matchPreviewRecord}>{data.homeRecord}</Text>
            ) : null}
          </View>
          <View style={s.matchPreviewCenter}>
            {mergedFinal ? (
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
              <View style={s.matchPreviewVsBlock}>
                <Text style={s.matchPreviewVsLabel}>VS</Text>
              </View>
            ) : centerBlock.variant === "score" || centerBlock.variant === "liveScore" ? (
              <View style={s.matchPreviewVsBlock}>
                {centerBlock.variant === "liveScore" ? (
                  <LiveMarkPill
                    pillStyle={s.matchPreviewLivePill}
                    textStyle={s.matchPreviewLivePillText}
                  />
                ) : null}
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
              <WcTeamFlagWithMetaNative teamId={isWcLeague ? awayTeamId : null}>
                <MatchTeamMarkNative
                  leagueRaw={data.leagueRaw}
                  side={data.awaySide}
                  palette={data.awayPalette}
                  jerseySize={48}
                  flagVariant="preview"
                />
              </WcTeamFlagWithMetaNative>
            </View>
            <Text style={s.matchPreviewTeamName} numberOfLines={2}>
              {data.awayCompact}
            </Text>
            {data.awayRecord ? (
              <Text style={s.matchPreviewRecord}>{data.awayRecord}</Text>
            ) : null}
          </View>
        </View>
        {scheduleMeta && !mergedFinal ? (
          <View style={s.matchPreviewScheduleMeta}>
            <Text style={s.matchPreviewScheduleMetaLine} numberOfLines={2}>
              {scheduleMeta.kickoffValue ? (
                <>
                  <Text style={s.matchPreviewScheduleMetaLabel}>{t.kickoffAt} </Text>
                  <Text style={s.matchPreviewScheduleMetaValue}>
                    {scheduleMeta.kickoffValue}
                  </Text>
                </>
              ) : null}
              {scheduleMeta.broadcastLabels.length > 0 ? (
                <>
                  {scheduleMeta.kickoffValue ? (
                    <Text style={s.matchPreviewScheduleMetaLabel}> </Text>
                  ) : null}
                  <Text style={s.matchPreviewScheduleMetaLabel}>
                    {t.broadcasters}{" "}
                  </Text>
                  <Text style={s.matchPreviewScheduleBroadcast}>
                    {scheduleMeta.broadcastLabels.join(" : ")}
                  </Text>
                </>
              ) : null}
            </Text>
          </View>
        ) : null}
        {overlayMarketBar ? (
          <View style={s.matchPreviewMarketBarWrap}>
            <MatchCardOverlayMarketBarNative
              {...overlayMarketBar}
              language={language}
              t={t}
            />
          </View>
        ) : null}
        {goalScorerInfo ? (
          <View style={s.matchPreviewGoalScorerWrap}>
            <View style={s.matchPreviewGoalScorerDivider} />
            <WcGoalScorerResultRowNative
              label={t.wcGoalScorerLabel}
              info={goalScorerInfo}
            />
          </View>
        ) : null}
        {mergedFinal && mergedFinal.statRows.length > 0 ? (
          <View style={s.matchPreviewStatBlock}>
            {mergedFinal.statRows.map((row) => (
              <View key={row.key} style={s.matchPreviewStatRow}>
                <Text style={s.matchPreviewStatLabel} numberOfLines={1}>
                  {row.label}
                </Text>
                <View style={s.matchPreviewStatBarSlot}>
                  <ResultStatRatingBarNative
                    ratio={row.ratio}
                    size="sm"
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
        ) : null}
      </View>
      {showEditButton && onEditPrediction ? (
        <Pressable
          onPress={onEditPrediction}
          hitSlop={8}
          style={({ pressed }) => [
            s.matchPreviewEditBtn,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.editScoresCta}
        >
          <Text style={s.matchPreviewEditIcon}>✎</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onClose}
        hitSlop={8}
        style={({ pressed }) => [
          s.matchPreviewCloseBtn,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
      >
        <Text style={s.matchPreviewCloseIcon}>×</Text>
      </Pressable>
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
  predictToolsTab: null | "h2h" | "market" | "stats" | "preview" | "standings";
  setPredictToolsTab: (value: null | "h2h" | "market" | "stats" | "preview" | "standings") => void;
  winner: "home" | "away" | "draw" | null;
  isSoccerPredict: boolean;
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
  goalScorerPick?: WcGoalScorerPick | null;
  setGoalScorerPick?: (value: WcGoalScorerPick | null) => void;
  mergedFinalPreview?: PredictModalMergedFinalPreview | null;
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
}: PredictModalProps) {
  const reduceMotion = useReducedMotion() ?? false;

  /**
   * Web `PredictionFormV2` の pageContainer stagger に相当（delayChildren 30ms + 45ms×index）
   */
  const blockIn = (staggerIndex: number) =>
    reduceMotion ? undefined : predictBlockFadeUpEnter(staggerIndex);
  const toolPanelIn = reduceMotion ? undefined : predictPanelRevealEnter();

  const backdropEnter = reduceMotion ? undefined : predictModalBackdropEnter();
  const backdropExit = reduceMotion ? undefined : predictModalBackdropExit();
  const sheetEnter = reduceMotion ? undefined : predictModalSheetEnter();
  const sheetExit = reduceMotion ? undefined : predictModalSheetExit();

  const [layersVisible, setLayersVisible] = useState(visible);

  const previewEnter = reduceMotion ? undefined : predictModalPreviewEnter();

  /** 直接対決／市場／詳細スタッツ：タップでパネルを開閉 */
  function handleToolTabPress(
    tab: "h2h" | "market" | "stats" | "preview" | "standings"
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
    }
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

  const showScoreInputBlock =
    !spectatorStartedNoPost &&
    !editingLockedAfterKickoff &&
    (!isEditingPrediction || scoreFormExpanded);
  const canSubmit =
    showScoreInputBlock &&
    Boolean(winner) &&
    !predictSubmitting &&
    scoreHome !== "" &&
    scoreAway !== "";

  const modalChromeVisible = visible || exitingUi;
  const hasTool = Boolean(predictToolsTab);
  /** プレビュー有無でタブ行の stagger インデックスをずらす（Web と同趣旨の縦スタッガー） */
  const tabsStaggerIndex = matchPreview ? 1 : 0;
  const scoreStagger = hasTool ? 2 : 1;
  const submitStagger = hasTool ? 3 : 2;

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
        <View style={s.root} key="predict-modal-mounted">
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
              style={s.kav}
              pointerEvents="box-none"
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
                style={s.scroll}
                pointerEvents="auto"
              >
                <View style={s.modalContent}>
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
                        overlayCenterMode={overlayCenterMode}
                        showEditButton={
                          showMergedScheduledInPreview && !editingLockedAfterKickoff
                        }
                        onEditPrediction={() => setScoreFormExpanded(true)}
                      />
                    </Animated.View>
                  ) : null}
              <Animated.View
                style={
                  showWcOverlayTabs ? s.predictCyberDeck : s.predictToolsRow
                }
                entering={reduceMotion ? undefined : blockIn(tabsStaggerIndex)}
              >
                {showWcOverlayTabs ? (
                  <>
                    <Pressable
                      style={[
                        s.predictCyberTab,
                        predictToolsTab === "stats" && s.predictCyberTabActive,
                      ]}
                      onPress={() => handleToolTabPress("stats")}
                    >
                      <Text
                        style={[
                          s.predictCyberTabText,
                          predictToolsTab === "stats"
                            ? s.predictCyberTabTextActive
                            : s.predictCyberTabTextIdle,
                        ]}
                        numberOfLines={1}
                      >
                        {t.teamProfile}
                      </Text>
                    </Pressable>
                    {showWcMatchPreview ? (
                      <Pressable
                        style={[
                          s.predictCyberTab,
                          predictToolsTab === "preview" && s.predictCyberTabActive,
                        ]}
                        onPress={() => handleToolTabPress("preview")}
                      >
                        <Text
                          style={[
                            s.predictCyberTabText,
                            predictToolsTab === "preview"
                              ? s.predictCyberTabTextActive
                              : s.predictCyberTabTextIdle,
                          ]}
                          numberOfLines={1}
                        >
                          {t.matchPreview}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[
                        s.predictCyberTab,
                        s.predictCyberTabLast,
                        predictToolsTab === "standings" && s.predictCyberTabActive,
                      ]}
                      onPress={() => handleToolTabPress("standings")}
                    >
                      <Text
                        style={[
                          s.predictCyberTabText,
                          predictToolsTab === "standings"
                            ? s.predictCyberTabTextActive
                            : s.predictCyberTabTextIdle,
                        ]}
                        numberOfLines={1}
                      >
                        {t.groupStandings}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={[
                        s.predictToolTab,
                        predictToolsTab === "h2h" && s.predictToolTabActive,
                      ]}
                      onPress={() => handleToolTabPress("h2h")}
                    >
                      <Text
                        style={[
                          s.predictToolTabText,
                          predictToolsTab !== "h2h" && s.predictToolTabTextInactive,
                        ]}
                      >
                        {t.tabH2h}
                      </Text>
                    </Pressable>
                    {!hideMarketTab ? (
                      <Pressable
                        style={[
                          s.predictToolTab,
                          predictToolsTab === "market" && s.predictToolTabActive,
                        ]}
                        onPress={() => handleToolTabPress("market")}
                      >
                        <Text
                          style={[
                            s.predictToolTabText,
                            predictToolsTab !== "market" && s.predictToolTabTextInactive,
                          ]}
                        >
                          {t.tabMarket}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[
                        s.predictToolTab,
                        predictToolsTab === "stats" && s.predictToolTabActive,
                      ]}
                      onPress={() => handleToolTabPress("stats")}
                    >
                      <Text
                        style={[
                          s.predictToolTabText,
                          predictToolsTab !== "stats" && s.predictToolTabTextInactive,
                        ]}
                      >
                        {t.tabStats}
                      </Text>
                    </Pressable>
                  </>
                )}
              </Animated.View>

              {predictToolsTab ? (
                <Animated.View
                  key={`predict-tool-${predictToolsTab}`}
                  entering={toolPanelIn}
                >
                  <GlassPanel
                    variant="tool"
                    showGrid={
                      predictToolsTab === "h2h" ||
                      predictToolsTab === "market" ||
                      predictToolsTab === "stats"
                    }
                  >
                    {predictToolsTab === "stats" && showWcOverlayTabs ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.teamProfile}</Text>
                        <View style={s.predictToolsPanelDivider} />
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
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                      </>
                    ) : predictToolsTab === "preview" && showWcMatchPreview ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.matchPreview}</Text>
                        <View style={s.predictToolsPanelDivider} />
                        {predictData ? (
                          <WcMatchPreviewPanelNative
                            gameId={predictData.gameId}
                            language={language}
                            t={t}
                          />
                        ) : (
                          <Text style={s.predictToolsPanelSub}>{t.predictTabDataSoon}</Text>
                        )}
                      </>
                    ) : predictToolsTab === "standings" && showWcOverlayTabs ? (
                      <>
                        <Text style={s.predictToolsPanelKicker}>{t.groupStandings}</Text>
                        <View style={s.predictToolsPanelDivider} />
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
                              predictToolsTab === "preview" || predictToolsTab === "standings"
                                ? "stats"
                                : predictToolsTab
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
                    <Animated.View entering={blockIn(scoreStagger)}>
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
                    </Animated.View>
                  ) : null}

                  {showScoreInputBlock ? (
                    <>
                      <Animated.View entering={blockIn(scoreStagger)}>
                        <GlassPanel variant="form">
                          <Text style={s.predictSectionTitle}>
                            {t.scorePredictTitle}
                          </Text>
                          <View style={s.scoreGrid}>
                            <View style={s.scoreCol}>
                              <Text style={s.teamNameLabel} numberOfLines={1}>
                                {predictHomeTeamLabel || "HOME"}
                              </Text>
                              <View style={s.scoreInputWrap}>
                                <TextInput
                                  value={scoreHome}
                                  onChangeText={setScoreHome}
                                  keyboardType="number-pad"
                                  style={[s.scoreInput, s.scoreInputOverlay]}
                                  placeholder={t.scoreFieldPlaceholder}
                                  placeholderTextColor="rgba(0,245,255,0.36)"
                                />
                              </View>
                            </View>
                            <View style={s.scoreCol}>
                              <Text style={s.teamNameLabel} numberOfLines={1}>
                                {predictAwayTeamLabel || "AWAY"}
                              </Text>
                              <View style={s.scoreInputWrap}>
                                <TextInput
                                  value={scoreAway}
                                  onChangeText={setScoreAway}
                                  keyboardType="number-pad"
                                  style={[s.scoreInput, s.scoreInputOverlay]}
                                  placeholder={t.scoreFieldPlaceholder}
                                  placeholderTextColor="rgba(0,245,255,0.36)"
                                />
                              </View>
                            </View>
                          </View>
                          {isWcLeague && setGoalScorerPick ? (
                            <WcGoalScorerPickerNative
                              homeTeamId={rawTeamIdFromGameSide(predictData?.subjectGame.home)}
                              awayTeamId={rawTeamIdFromGameSide(predictData?.subjectGame.away)}
                              homeLabel={predictHomeTeamLabel || "HOME"}
                              awayLabel={predictAwayTeamLabel || "AWAY"}
                              predictedScore={predictedScoreForGoalScorer}
                              value={goalScorerPick}
                              onChange={setGoalScorerPick}
                              language={language}
                              t={t}
                            />
                          ) : null}
                          {isSoccerPredict && !isWcLeague ? (
                            <Text style={s.soccerHint}>{t.drawAvailable}</Text>
                          ) : null}
                        </GlassPanel>
                      </Animated.View>

                      <Animated.View entering={blockIn(submitStagger)}>
                        <Pressable
                          disabled={!canSubmit}
                          onPress={onSubmit}
                          style={({ pressed }) => [
                            s.submitOuter,
                            canSubmit ? s.submitOuterEnabled : s.submitOuterDisabled,
                            canSubmit && pressed && s.submitOuterPressed,
                          ]}
                        >
                          {canSubmit ? (
                            <LinearGradient
                              colors={[
                                "rgba(0,245,255,0.26)",
                                "rgba(0,190,230,0.36)",
                                "rgba(0,110,150,0.46)",
                              ]}
                              locations={[0, 0.42, 1]}
                              start={{ x: 0.5, y: 0 }}
                              end={{ x: 0.5, y: 1 }}
                              style={s.submitGradient}
                            >
                              <Text style={s.predictButtonText}>
                                {predictSubmitting
                                  ? isEditingPrediction
                                    ? t.updating
                                    : t.posting
                                  : isEditingPrediction
                                    ? t.submitUpdate
                                    : t.submitPrediction}
                              </Text>
                            </LinearGradient>
                          ) : (
                            <View style={s.submitDisabledFill}>
                              <Text style={s.predictButtonTextDisabled}>
                                {isEditingPrediction
                                  ? t.submitUpdate
                                  : t.submitPrediction}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    </>
                  ) : null}
                </>
              ) : null}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
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
  /** プレビュー・タブ・フォーム・送信の縦積み（間隔は詰めめ） */
  modalContent: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: 10,
  },
  predictToolsRow: {
    flexDirection: "row",
    gap: 6,
  },
  predictCyberDeck: {
    flexDirection: "row",
    minHeight: 40,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    backgroundColor: "rgba(4,8,14,0.9)",
    overflow: "hidden",
  },
  predictCyberTab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,245,255,0.14)",
    paddingHorizontal: 4,
  },
  predictCyberTabLast: {
    borderRightWidth: 0,
  },
  predictCyberTabActive: {
    backgroundColor: "#00F5FF",
  },
  predictCyberTabText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  predictCyberTabTextIdle: {
    color: "#00f5ff",
    textShadowColor: "rgba(0,245,255,0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  predictCyberTabTextActive: {
    color: "#050508",
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
    marginBottom: 6,
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
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "700",
    textAlign: "center",
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
    gap: 6,
  },
  scoreInputWrap: {
    borderRadius: 10,
    overflow: "hidden",
  },
  teamNameLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    textAlign: "left",
    paddingHorizontal: 2,
  },
  /** scoreInputClass: Oxanium + tabular-nums + font-bold + tracking-tight, text-base */
  scoreInput: {
    zIndex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontFamily: SCORE_INPUT_FONT,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    letterSpacing: -0.35,
    paddingHorizontal: 11,
    paddingVertical: 7,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  scoreInputOverlay: {
    borderColor: "rgba(0,245,255,0.24)",
    backgroundColor: "rgba(0,245,255,0.07)",
    color: "#e8fdff",
  },
  soccerHint: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(147,185,255,0.85)",
    textAlign: "center",
  },
  submitOuter: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  submitOuterEnabled: {
    borderColor: "rgba(0,245,255,0.42)",
  },
  submitOuterDisabled: {
    borderColor: "rgba(148,163,184,0.2)",
  },
  submitOuterPressed: {
    transform: [{ scale: 0.99 }],
  },
  submitGradient: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabledFill: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(71,85,105,0.13)",
  },
  predictButtonText: {
    color: "#f0fdff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  predictButtonTextDisabled: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  /** モーダル最上段の試合プレビュー（Web MatchCard の左右カラー帯・グリッドに寄せる） */
  matchPreviewShell: {
    position: "relative",
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  /** 一覧 `cardGridUnderlay` 相当: 方眼はこの下層だけ */
  matchPreviewGridUnderlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    borderRadius: 15,
    overflow: "hidden",
  },
  /** 方眼の上に全面敷き（シェルの padding は付けない。付けると余白に方眼だけ出る） */
  matchPreviewGradientPlatter: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    borderRadius: 15,
    overflow: "hidden",
  },
  matchPreviewLayerTopGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  matchPreviewLayerGlassFog: {
    ...StyleSheet.absoluteFillObject,
  },
  matchPreviewLayerShine: {
    ...StyleSheet.absoluteFillObject,
  },
  matchPreviewGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  /** ラウンド名・3 カラム。背景は透過のまま、上の platter を見せる */
  matchPreviewPaddedContent: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchPreviewMarketBarWrap: {
    marginTop: 8,
    paddingBottom: 4,
  },
  matchPreviewBiasLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "58%",
  },
  matchPreviewBiasRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "58%",
  },
  previewGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    overflow: "hidden",
  },
  previewGridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
  },
  previewGridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  matchPreviewCloseBtn: {
    position: "absolute",
    left: 6,
    top: 6,
    zIndex: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  matchPreviewEditBtn: {
    position: "absolute",
    right: 6,
    top: 6,
    zIndex: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  matchPreviewEditIcon: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: -1,
  },
  matchPreviewCloseIcon: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 17,
    lineHeight: 19,
    fontWeight: "300",
    marginTop: -1,
  },
  /** 右の × と重ならないよう横パディングのみ大きめ */
  matchPreviewRoundPadded: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    color: "rgba(241,245,255,0.95)",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 22,
    letterSpacing: 0.85,
    textAlign: "center",
    includeFontPadding: false,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 40,
  },
  matchPreviewGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4,
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
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  matchPreviewScheduleMetaLine: {
    textAlign: "center",
  },
  matchPreviewScheduleMetaLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  matchPreviewScheduleMetaValue: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontVariant: ["tabular-nums"],
  },
  matchPreviewScheduleBroadcast: {
    color: "rgba(207,250,254,0.9)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
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
    top: -4,
    zIndex: 5,
    maxWidth: "46%",
  },
  matchPreviewFinalBlock: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    gap: 2,
    paddingTop: 4,
  },
  matchPreviewOverlayPredictRow: {
    marginTop: 2,
    textAlign: "center",
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
    marginTop: 4,
    gap: 4,
    paddingBottom: 2,
  },
  matchPreviewStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MOBILE_RESULT_STAT_ROW_GAP,
    paddingVertical: 2,
  },
  matchPreviewStatLabel: {
    width: MOBILE_RESULT_STAT_LABEL_W,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  matchPreviewStatBarSlot: {
    flex: 1,
    minWidth: 0,
  },
  matchPreviewStatValue: {
    width: MOBILE_RESULT_STAT_VALUE_W,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 10,
    lineHeight: 14,
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
  matchPreviewVsLabel: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(236,254,255,0.95)",
    textAlign: "center",
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
    alignItems: "center",
    gap: 2,
  },
  /** Web `MatchCard` の HOME/AWAY: `text-xs font-bold uppercase opacity-85` + `bracketMarketTeamTypography` */
  matchPreviewSideTag: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.96,
    includeFontPadding: false,
  },
  matchPreviewJersey: { marginTop: 2, marginBottom: 2 },
  /** 一覧 `GamesHomeScreen` の `teamNameMain` と同色・同系のタイポ */
  matchPreviewTeamName: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 13,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 1.04,
    includeFontPadding: false,
    color: colors.textPrimary,
    textTransform: "uppercase",
    textAlign: "center",
  },
  matchPreviewRecord: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    lineHeight: 11,
    color: "#fff",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  matchPreviewCenter: {
    flex: 1.05,
    minWidth: 0,
    alignItems: "center",
    paddingTop: 22,
  },
  matchPreviewScoreRow: { textAlign: "center" },
  matchPreviewScoreNum: {
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontSize: 22,
    lineHeight: 24,
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
  matchPreviewSeries: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    marginTop: 2,
    color: "rgba(200,220,255,0.7)",
  },
});
