import { useMemo, useState } from "react";
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
  UIManager,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../../theme/tokens";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import { PredictToolTabContent } from "./PredictToolTabContent";
import type { NativeGameRow, SupportedLeague } from "./useTodayGames";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import type { PredictHeroFromRect } from "./predictHeroTransition";
import { predictBlockFadeUpEnter, predictPanelRevealEnter } from "./predictMotion";
import {
  MODAL_PREVIEW_GRID_LAYER_OPACITY,
  MODAL_PREVIEW_GRID_LINE_COLOR,
  shellGridHorizontalLineTopsCentered,
  shellGridVerticalLineLeftsCentered,
} from "./matchCardShellGrid";

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

const PREVIEW_DISPLAY = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "BebasNeue_400Regular",
});
const PREVIEW_NUMERIC = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

/** 一覧 `GameCardList` の `CardBlurLayer` と同設定（方眼の上のガラス感を揃える） */
function MatchPreviewShellBlur() {
  if (!hasNativeBlurView) {
    return <View style={s.matchPreviewBlurFallback} />;
  }
  if (Platform.OS === "ios") {
    return <BlurView intensity={30} tint="default" style={s.matchPreviewBlur} />;
  }
  if (Platform.OS === "android") {
    return (
      <BlurView
        intensity={28}
        tint="default"
        experimentalBlurMethod="dimezisBlurView"
        style={s.matchPreviewBlur}
      />
    );
  }
  return <View style={s.matchPreviewBlurFallback} />;
}

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
}: {
  data: PredictModalMatchPreview;
  onClose: () => void;
  closeLabel: string;
}) {
  const { centerBlock, seriesPair } = data;
  const homeC = data.homePalette.primary;
  const awayC = data.awayPalette.primary;
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
        <MatchPreviewShellBlur />
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
      <View pointerEvents="box-none" style={s.matchPreviewPaddedContent}>
        {data.roundLabel ? (
          <Text style={s.matchPreviewRoundPadded} numberOfLines={1}>
            {data.roundLabel}
          </Text>
        ) : null}
        <View style={s.matchPreviewGrid}>
          <View style={s.matchPreviewCol}>
            <Text style={s.matchPreviewSideTag}>HOME</Text>
            <View style={s.matchPreviewJersey}>
              <JerseyMarkAdaptive
                accent={data.homePalette.primary}
                accentEnd={data.homePalette.secondary}
                size={48}
              />
            </View>
            <Text style={s.matchPreviewTeamName} numberOfLines={2}>
              {data.homeCompact}
            </Text>
            {data.homeRecord ? (
              <Text style={s.matchPreviewRecord}>{data.homeRecord}</Text>
            ) : null}
          </View>
          <View style={s.matchPreviewCenter}>
            {centerBlock.variant === "score" ? (
              <>
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
              </>
            ) : (
              <View style={s.matchPreviewVsBlock}>
                <Text style={s.matchPreviewVsText} numberOfLines={1}>
                  VS
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
            <Text style={s.matchPreviewSideTag}>AWAY</Text>
            <View style={s.matchPreviewJersey}>
              <JerseyMarkAdaptive
                accent={data.awayPalette.primary}
                accentEnd={data.awayPalette.secondary}
                size={48}
              />
            </View>
            <Text style={s.matchPreviewTeamName} numberOfLines={2}>
              {data.awayCompact}
            </Text>
            {data.awayRecord ? (
              <Text style={s.matchPreviewRecord}>{data.awayRecord}</Text>
            ) : null}
          </View>
        </View>
      </View>
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
  predictToolsTab: null | "h2h" | "market" | "stats";
  setPredictToolsTab: (value: null | "h2h" | "market" | "stats") => void;
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
  /** 一覧カードの画面上矩形。指定時はプレビューまでヒーロー風モーフ */
  heroFromRect: PredictHeroFromRect | null;
  /** 試合終了・未投稿: Web オーバーレイ同様スコア入力・送信を出さない */
  spectatorFinalNoPost?: boolean;
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
};

/** モバイル `PredictionFormV2`：glassCard（form）/ glassCardStatsPanel（tool） */
function GlassPanel({
  children,
  variant = "form",
}: {
  children: React.ReactNode;
  variant?: "form" | "tool";
}) {
  return (
    <View
      style={[
        s.glassBase,
        variant === "form" ? s.glassOuterForm : s.glassOuterTool,
      ]}
    >
      {(Platform.OS === "ios" || Platform.OS === "android") && (
        <BlurView
          intensity={Platform.OS === "ios" ? 24 : 20}
          tint="dark"
          {...(Platform.OS === "android"
            ? { blurMethod: "dimezisBlurViewSdk31Plus" as const, blurReductionFactor: 4 }
            : {})}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={s.glassPanelTint} pointerEvents="none" />
      <View
        style={
          variant === "form" ? s.glassPanelContentForm : s.glassPanelContentTool
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
  heroFromRect,
  spectatorFinalNoPost = false,
  predictData = null,
}: PredictModalProps) {
  void heroFromRect;
  const canSubmit =
    Boolean(winner) && !predictSubmitting && scoreHome !== "" && scoreAway !== "";

  /**
   * Web `ScheduleList` オーバーレイ（モバイル）: dim は即表示、MatchCard 相当は motion 外で即表示、
   * `PredictionFormV2` のみ pageContainer + fadeUp スタッガー。ここではプレビュー即表示、タブ以降のみ fadeUp。
   */
  const blockIn = (_index: number) => undefined;
  const toolPanelIn = undefined;

  const hasTool = Boolean(predictToolsTab);
  const scoreStagger = hasTool ? 2 : 1;
  const submitStagger = hasTool ? 3 : 2;
  const requestClose = onClose;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={s.root}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 28 : 22}
              tint="dark"
              {...(Platform.OS === "android"
                ? { blurMethod: "dimezisBlurViewSdk31Plus" as const, blurReductionFactor: 4 }
                : {})}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {/** Web `bg-black/35` 相当。フェードなし（即表示） */}
          <View style={s.backdropDim} pointerEvents="none" />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={requestClose}
            accessibilityRole="button"
          />
        </View>
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
            {/** Web オーバーレイ: 上段カード即表示、予想フォーム部のみ fadeUp スタッガー */}
            <View style={s.modalContent}>
              {matchPreview ? (
                <View>
                  <PredictMatchPreview
                    data={matchPreview}
                    onClose={requestClose}
                    closeLabel={t.close}
                  />
                </View>
              ) : null}
              <Animated.View style={s.predictToolsRow} entering={blockIn(0)}>
                <Pressable
                  style={[
                    s.predictToolTab,
                    predictToolsTab === "h2h" && s.predictToolTabActive,
                  ]}
                  onPress={() => setPredictToolsTab(predictToolsTab === "h2h" ? null : "h2h")}
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
                <Pressable
                  style={[
                    s.predictToolTab,
                    predictToolsTab === "market" && s.predictToolTabActive,
                  ]}
                  onPress={() =>
                    setPredictToolsTab(predictToolsTab === "market" ? null : "market")
                  }
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
                <Pressable
                  style={[
                    s.predictToolTab,
                    predictToolsTab === "stats" && s.predictToolTabActive,
                  ]}
                  onPress={() =>
                    setPredictToolsTab(predictToolsTab === "stats" ? null : "stats")
                  }
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
              </Animated.View>

              {predictToolsTab ? (
                <Animated.View entering={toolPanelIn}>
                  <GlassPanel variant="tool">
                    <Text style={s.predictToolsPanelKicker}>
                      {predictToolsTab === "h2h"
                        ? t.tabH2h
                        : predictToolsTab === "market"
                          ? t.tabMarket
                          : t.tabStats}
                    </Text>
                    <View style={s.predictToolsPanelDivider} />
                    {predictData && matchPreview ? (
                      <PredictToolTabContent
                        tab={predictToolsTab}
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
                  </GlassPanel>
                </Animated.View>
              ) : null}

              {spectatorFinalNoPost ? (
                <Animated.View entering={blockIn(scoreStagger)}>
                  <GlassPanel variant="form">
                    <Text style={s.spectatorHint}>{t.postGameSpectatorHint}</Text>
                  </GlassPanel>
                </Animated.View>
              ) : (
                <>
                  <Animated.View entering={blockIn(scoreStagger)}>
                    <GlassPanel variant="form">
                      <Text style={s.predictSectionTitle}>{t.scorePredictTitle}</Text>
                      <View style={s.scoreGrid}>
                        <View style={s.scoreCol}>
                          {matchPreview ? (
                            <LinearGradient
                              pointerEvents="none"
                              colors={[
                                hexToRgba(matchPreview.homePalette.primary, 0.2),
                                hexToRgba(matchPreview.homePalette.primary, 0.04),
                                "rgba(0,0,0,0)",
                              ]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={s.scoreColTint}
                            />
                          ) : null}
                          <Text style={s.teamNameLabel} numberOfLines={2}>
                            {predictHomeTeamLabel || "HOME"}
                          </Text>
                          <TextInput
                            value={scoreHome}
                            onChangeText={setScoreHome}
                            keyboardType="number-pad"
                            style={[
                              s.scoreInput,
                              matchPreview && {
                                borderColor: hexToRgba(
                                  matchPreview.homePalette.primary,
                                  0.45
                                ),
                                backgroundColor: "rgba(255,255,255,0.08)",
                              },
                            ]}
                            placeholder={t.scoreFieldPlaceholder}
                            placeholderTextColor="rgba(255,255,255,0.35)"
                          />
                        </View>
                        <View style={s.scoreCol}>
                          {matchPreview ? (
                            <LinearGradient
                              pointerEvents="none"
                              colors={[
                                "rgba(0,0,0,0)",
                                hexToRgba(matchPreview.awayPalette.primary, 0.1),
                                hexToRgba(matchPreview.awayPalette.primary, 0.22),
                              ]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={s.scoreColTint}
                            />
                          ) : null}
                          <Text style={s.teamNameLabel} numberOfLines={2}>
                            {predictAwayTeamLabel || "AWAY"}
                          </Text>
                          <TextInput
                            value={scoreAway}
                            onChangeText={setScoreAway}
                            keyboardType="number-pad"
                            style={[
                              s.scoreInput,
                              matchPreview && {
                                borderColor: hexToRgba(
                                  matchPreview.awayPalette.primary,
                                  0.45
                                ),
                                backgroundColor: "rgba(255,255,255,0.08)",
                              },
                            ]}
                            placeholder={t.scoreFieldPlaceholder}
                            placeholderTextColor="rgba(255,255,255,0.35)"
                          />
                        </View>
                      </View>
                      {isSoccerPredict ? (
                        <Text style={s.soccerHint}>{t.drawAvailable}</Text>
                      ) : null}
                    </GlassPanel>
                  </Animated.View>

                  {/** 送信：h-12, rounded-2xl, focus 相当の枠。背景は Web の radial を線形で近似。 */}
                  <Animated.View entering={blockIn(submitStagger)}>
                    <Pressable
                      disabled={!canSubmit}
                      onPress={onSubmit}
                      style={({ pressed }) => [
                        s.submitOuter,
                        !canSubmit && s.submitOuterDisabled,
                        canSubmit && pressed && s.submitOuterPressed,
                      ]}
                    >
                      {canSubmit ? (
                        <LinearGradient
                          colors={[
                            "rgba(59,130,246,0.92)",
                            "rgba(37,99,235,0.88)",
                            "rgba(29,78,216,0.58)",
                            "rgba(29,78,216,0.22)",
                            "rgba(29,78,216,0.06)",
                          ]}
                          locations={[0, 0.36, 0.58, 0.8, 1]}
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
                                : t.submitPost}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={s.submitDisabledFill}>
                          <Text style={s.predictButtonTextDisabled}>
                            {isEditingPrediction ? t.submitUpdate : t.submitPost}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
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
  /** モバイル: h-9, rounded-xl, text-xs, font-semibold, border + bg */
  predictToolTab: {
    flex: 1,
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
  glassPanelContentForm: {
    position: "relative",
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  spectatorHint: {
    color: "rgba(226,232,240,0.88)",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  scoreGrid: {
    flexDirection: "row",
    gap: 12,
  },
  scoreCol: {
    flex: 1,
    gap: 8,
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
  },
  scoreColTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  teamNameLabel: {
    zIndex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  /** scoreInputClass: rounded-xl, border-white/15, text-base, px-3.5, py-2.5 */
  scoreInput: {
    zIndex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: "center",
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
    borderColor: "rgba(59,130,246,0.4)",
  },
  submitOuterDisabled: {
    borderColor: "rgba(255,255,255,0.15)",
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  predictButtonText: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  predictButtonTextDisabled: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
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
  matchPreviewBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  matchPreviewBlurFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,28,38,0.12)",
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
    right: 6,
    top: 6,
    zIndex: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  matchPreviewCloseIcon: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "300",
    marginTop: -1,
  },
  /** 右の × と重ならないよう横パディングのみ大きめ */
  matchPreviewRoundPadded: {
    fontFamily: PREVIEW_DISPLAY,
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
  matchPreviewVsText: {
    fontFamily: PREVIEW_DISPLAY,
    fontSize: 24,
    lineHeight: 26,
    color: "rgba(255,255,255,0.96)",
    textAlign: "center",
  },
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
    fontFamily: PREVIEW_DISPLAY,
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
    fontFamily: PREVIEW_DISPLAY,
    fontSize: 13,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    includeFontPadding: false,
    color: colors.textPrimary,
    textTransform: "uppercase",
    textAlign: "center",
  },
  matchPreviewRecord: {
    fontFamily: PREVIEW_NUMERIC,
    fontSize: 8,
    lineHeight: 11,
    color: "#fff",
    textAlign: "center",
  },
  matchPreviewCenter: {
    flex: 1.05,
    minWidth: 0,
    alignItems: "center",
    paddingTop: 22,
  },
  matchPreviewScoreRow: { textAlign: "center" },
  matchPreviewScoreNum: {
    fontFamily: PREVIEW_NUMERIC,
    fontSize: 20,
    color: "#fff",
  },
  matchPreviewScoreDash: {
    fontFamily: PREVIEW_NUMERIC,
    fontSize: 18,
    color: "rgba(255,255,255,0.55)",
  },
  matchPreviewSub: {
    fontFamily: PREVIEW_NUMERIC,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 2,
  },
  matchPreviewSeries: {
    fontFamily: PREVIEW_NUMERIC,
    fontSize: 10,
    marginTop: 2,
    color: "rgba(200,220,255,0.7)",
  },
});
