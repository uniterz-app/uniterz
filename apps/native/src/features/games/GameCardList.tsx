import { Platform, Pressable, StyleSheet, Text, TextInput, View, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { registerTutorialTarget } from "../tutorial/tutorialMeasureNative";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { gamesCyberEaseBezier } from "./gamesPageMotion";
import type { TeamRecordSnapshot } from "./teamRecordDisplay";
import MatchTeamMarkNative from "./MatchTeamMarkNative";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import { LiveMarkPill } from "./LiveMarkPill";
import MatchPkResultLineNative from "./MatchPkResultLineNative";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import MatchListCyberClipNative from "./MatchListCyberClipNative";
import MatchListCyberDecorNative from "./MatchListCyberDecorNative";
import MatchListLineFrameNative from "./MatchListLineFrameNative";
import { isNbaPickupGame } from "../../../../../lib/nba/isPickupGame";
import { resolveTutorialPickupGameId } from "../../../../../lib/tutorial/tutorialPickupGame";
import MatchCardListCtaNative, {
  type MatchCardListCtaVariant,
} from "./MatchCardListCtaNative";
import MatchCardTeamNameNative from "./MatchCardTeamNameNative";
import MatchCardEntryScanNative from "./MatchCardEntryScanNative";
import {
  useGameCardListRowEntrance,
  gameCardLineFrameDrawDelayMs,
  gameCardShouldAnimateLineFrameDraw,
  type GameCardEntranceVariant,
} from "./useGameCardListRowEntrance";
import TutorialCardTapHintNative from "../tutorial/TutorialCardTapHintNative";
import { MATCH_CARD_DISPLAY_FONT } from "./matchCardTypography";
import { displayNbaRoundLabel } from "../../../../../lib/games/displayNbaRoundLabel";
import { matchLineFramePaint } from "../../../../../lib/games/matchListLineFrame";
import type { NbaTopScorerPick } from "../../../../../lib/nba/topScorer";
import BatchCompactCardNative from "./BatchCompactCardNative";
import { prefetchMatchupDetailBundle } from "../../../../../lib/nba/predict/fetchMatchupDetailClient";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";
function matchRoundSideCode(roundLabel: string): string {
  const u = roundLabel.toUpperCase();
  if (u.includes("PLAYOFF") || u.includes("プレーオフ")) return "PO";
  if (u.includes("PLAY-IN") || u.includes("PLAY IN") || u.includes("プレーイン")) {
    return "PI";
  }
  if (u.includes("PRESEASON") || u.includes("プレシーズン")) return "PS";
  return "RS";
}

function resolveLineFrameLabels(
  roundLabel: string,
  pickup: boolean,
  pickupMark: "top" | "left"
): { top: string; left?: string } {
  if (!pickup) return { top: roundLabel };
  if (pickupMark === "left") {
    return { top: roundLabel, left: "PICK UP" };
  }
  return { top: "PICK UP", left: matchRoundSideCode(roundLabel) };
}

type ScreenStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export type GameCardListProps = {
  games: Array<Record<string, unknown>>;
  /** false のときは日付切替などでカードの入場アニメを付けない（再マウント時のがたつき防止） */
  enteringAnimationEnabled?: boolean;
  /** `light` = 日付変更時の簡易入場（フル cyber reveal は初回・リーグ切替のみ） */
  entranceVariant?: GameCardEntranceVariant;
  predictedGameIds: Set<string>;
  language: GamesLanguage | string;
  t: GamesTexts;
  styles: ScreenStyles;
  openPredictModal: (game: Record<string, unknown>) => void | Promise<void>;
  resolveGameTeamName: (
    side: unknown,
    fallback: unknown,
    defaultName: string
  ) => string;
  toCompactTeamName: (leagueRaw: unknown, rawName: string) => string;
  isSoccerLeague: (leagueRaw: unknown) => boolean;
  resolveGameStatus: (game: Record<string, unknown>) => "scheduled" | "live" | "final";
  isGameStarted: (game: Record<string, unknown>) => boolean;
  resolveLeagueColor: (leagueRaw: unknown) => string;
  getGameCardCenterBlock: (game: Record<string, unknown>) => GameCardCenterBlock;
  resolveSeriesLabel: (game: Record<string, unknown>) => string | null;
  /** プレーオフ: モバイル `MatchCardMobile` と同様のシリーズ数字（リード側のみ強調） */
  resolveSeriesPair: (
    game: Record<string, unknown>
  ) => { home: number; away: number } | null;
  /** チーム名下の (W-L) / (W-D-L) 行。モバイル Web の homeRecord/awayRecord 相当 */
  getTeamRecordLabel?: (
    side: unknown,
    leagueRaw?: unknown,
    seasonPhase?: unknown
  ) => string | null;
  /** WC 戦績マップ（ScheduleList の teamRecordMap 相当） */
  teamRecordById?: Readonly<Record<string, TeamRecordSnapshot>>;
  resolveTeamJerseyPalette: (
    leagueRaw: unknown,
    side: unknown,
    fallback: string
  ) => { primary: string; secondary: string };
  /** 先頭カードにパルス誘導（初回チュートリアル） */
  tutorialPulseFirstCard?: boolean;
  tutorialPulseLabel?: string;
  /** `match-card` 測定を登録（ライブチュートリアル） */
  tutorialRegisterMatchCard?: boolean;
  /** 実ピックアップ試合の左辺 `PICK UP` を `match-pickup-label` として登録 */
  tutorialRegisterPickupLabel?: boolean;
  /** `lineFrame` = 塗りなし・上下ラベルで途切れた線枠。本番一覧の既定 */
  shellVariant?: "cyber" | "lineFrame";
  /** ピックアップ表記。本番は左辺 `PICK UP` */
  pickupMark?: "top" | "left";
  /** まとめて入力。対象カードをスコア＋最多得点セグメントに差し替える */
  batchEdit?: {
    ids: ReadonlySet<string>;
    scores: Readonly<Record<string, { home: string; away: string } | undefined>>;
    onChange: (gameId: string, side: "home" | "away", value: string) => void;
    scorers?: Readonly<Record<string, NbaTopScorerPick | undefined>>;
    onScorer?: (gameId: string, pick: NbaTopScorerPick | null) => void;
    /** teamId → シーズン平均得点（整数） */
    teamPpg?: Readonly<Record<string, number>>;
    /** 得点リールを動かしているあいだ true */
    onScoreDrag?: (locked: boolean) => void;
    /** 選択中のカード（このカードだけリールが動く） */
    focusedId?: string | null;
    onFocus?: (gameId: string | null) => void;
    /** 同点で提出できないときにカードへ出す短い文言 */
    tieLabel?: string;
  } | null;
};

type GameCardListRowProps = GameCardListProps & {
  game: Record<string, unknown>;
  /** ページ表示時の入場スタッガー用 */
  rowIndex: number;
  enteringAnimationEnabled: boolean;
  entranceVariant: GameCardEntranceVariant;
  /** 案内する実ピックアップ試合 */
  tutorialPickupGameId?: string | null;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BATCH_SWAP_OUT_MS = 160;
const BATCH_SWAP_IN_MS = 200;
const BATCH_SWAP_STAGGER_MS = 36;
const BATCH_SWAP_SHIFT = 10;

/** まとめて入力の入りと戻り。出てから、逆方向に入る */
function useBatchCardSwap(active: boolean, reduceMotion: boolean, rowIndex: number) {
  const [shown, setShown] = useState(active);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const gen = useRef(0);
  const activeRef = useRef(active);
  const skipEnter = useRef(true);
  activeRef.current = active;

  const commit = useCallback((id: number) => {
    if (gen.current !== id) return;
    setShown(activeRef.current);
  }, []);

  useEffect(() => {
    if (active === shown) return;
    if (reduceMotion) {
      setShown(active);
      return;
    }
    const id = ++gen.current;
    const delay = Math.min(rowIndex, 5) * BATCH_SWAP_STAGGER_MS;
    opacity.value = withDelay(
      delay,
      withTiming(
        0,
        { duration: BATCH_SWAP_OUT_MS, easing: gamesCyberEaseBezier },
        (finished) => {
          if (finished) runOnJS(commit)(id);
        }
      )
    );
    translateY.value = withDelay(
      delay,
      withTiming(active ? -BATCH_SWAP_SHIFT : BATCH_SWAP_SHIFT, {
        duration: BATCH_SWAP_OUT_MS,
        easing: gamesCyberEaseBezier,
      })
    );
  }, [active, shown, reduceMotion, rowIndex, commit, opacity, translateY]);

  useEffect(() => {
    if (skipEnter.current) {
      skipEnter.current = false;
      return;
    }
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = 0;
    translateY.value = shown ? BATCH_SWAP_SHIFT : -BATCH_SWAP_SHIFT;
    opacity.value = withTiming(1, {
      duration: BATCH_SWAP_IN_MS,
      easing: gamesCyberEaseBezier,
    });
    translateY.value = withTiming(0, {
      duration: BATCH_SWAP_IN_MS,
      easing: gamesCyberEaseBezier,
    });
  }, [shown, reduceMotion, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  return { shown, style };
}

/** 試合一覧行：Reanimated による depth reveal / bottom-up 入場 */
export const GameCardListRow = memo(function GameCardListRow(props: GameCardListRowProps) {
  const {
    game,
    rowIndex,
    predictedGameIds,
    t,
    styles,
    openPredictModal,
    resolveGameTeamName,
    toCompactTeamName,
    resolveGameStatus,
    isGameStarted,
    resolveLeagueColor,
    getGameCardCenterBlock,
    resolveSeriesLabel,
    resolveSeriesPair,
    getTeamRecordLabel = () => null,
    teamRecordById = {},
    resolveTeamJerseyPalette,
    enteringAnimationEnabled,
    entranceVariant,
    language,
    tutorialPulseFirstCard = false,
    tutorialPulseLabel,
    tutorialRegisterMatchCard = false,
    tutorialRegisterPickupLabel = false,
    tutorialPickupGameId = null,
    shellVariant = "lineFrame",
    pickupMark = "left",
    batchEdit = null,
  } = props;
  const useLineFrame = shellVariant === "lineFrame";

  const showTutorialPulse = tutorialPulseFirstCard && rowIndex === 0;
  const cardMeasureRef = useRef<View>(null);

  useEffect(() => {
    if (rowIndex !== 0 || !tutorialRegisterMatchCard) return;
    return registerTutorialTarget("match-card", () =>
      new Promise((resolve) => {
        const node = cardMeasureRef.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) resolve({ x, y, width, height });
          else resolve(null);
        });
      })
    );
  }, [rowIndex, tutorialRegisterMatchCard]);

  const reduceMotion = useReducedMotion() ?? false;
  const gameId = String(game.id ?? "");
  const isPredicted = predictedGameIds.has(gameId);
  const awayName = resolveGameTeamName(game.away, game.awayTeamName, "AWAY");
  const homeName = resolveGameTeamName(game.home, game.homeTeamName, "HOME");
  const awayCompact = toCompactTeamName(game.league, awayName);
  const homeCompact = toCompactTeamName(game.league, homeName);
  const status = resolveGameStatus(game);
  const started = isGameStarted(game);
  const leagueColor = resolveLeagueColor(game.league);
  const leagueKey = String(game.league ?? "").toLowerCase();
  const showSideLabels = true;
  const isWcCard = false;
  const homeTeamId =
    (game.home as { teamId?: string } | undefined)?.teamId ??
    (game.homeTeamId as string | undefined) ??
    null;
  const awayTeamId =
    (game.away as { teamId?: string } | undefined)?.teamId ??
    (game.awayTeamId as string | undefined) ??
    null;
  const centerBlock = getGameCardCenterBlock(game);
  const roundLabelRaw = game.roundLabel;
  const roundLabel = displayNbaRoundLabel(
    typeof roundLabelRaw === "string" ? roundLabelRaw.trim() : "",
    language === "ja"
  );
  const isPickup = isNbaPickupGame(game);
  const frameLabels = resolveLineFrameLabels(roundLabel, isPickup, pickupMark);
  const registerPickupLabel =
    tutorialRegisterPickupLabel &&
    isPickup &&
    Boolean(tutorialPickupGameId) &&
    String(game.id ?? "") === tutorialPickupGameId;
  const isKnockout = false;
  const seriesLabel = resolveSeriesLabel(game);
  const seriesPair = resolveSeriesPair(game);
  const homeRecordLabel = getTeamRecordLabel(
    game.home,
    game.league,
    game.seasonPhase
  );
  const awayRecordLabel = getTeamRecordLabel(
    game.away,
    game.league,
    game.seasonPhase
  );
  const homePalette = resolveTeamJerseyPalette(game.league, game.home, "#ff6b8a");
  const awayPalette = resolveTeamJerseyPalette(game.league, game.away, "#5aa4ff");
  const ctaLabel =
    status === "final"
      ? "FINAL"
      : started
      ? t.live
      : isPredicted
      ? t.predicted
      : t.predict;
  const ctaVariant: MatchCardListCtaVariant =
    status === "final"
      ? "final"
      : started
      ? "live"
      : isPredicted
      ? "predicted"
      : "normal";
  const ctaDisplayLabel = ctaLabel;
  const batchEditing = Boolean(
    batchEdit &&
      !started &&
      !isPredicted &&
      status !== "final" &&
      batchEdit.ids.has(gameId)
  );

  const showPredictPrimaryGlow =
    status !== "final" && !started && !isPredicted;

  const ent = useGameCardListRowEntrance({
    rowIndex,
    enteringAnimationEnabled,
    reduceMotion,
    entranceVariant,
    isPredicted,
    showPredictPrimaryGlow,
    suppressReplay: Boolean(batchEdit),
  });

  /** Canvas 準備後に枠側で描く。親 strokeEnd だとジャージ計測遅れでパスアニメが消える */
  const lineFrameAnimateDraw =
    !batchEdit &&
    useLineFrame &&
    gameCardShouldAnimateLineFrameDraw({
      enteringAnimationEnabled,
      reduceMotion,
      entranceVariant,
      rowIndex,
    });
  const lineFrameDrawDelayMs = lineFrameAnimateDraw
    ? gameCardLineFrameDrawDelayMs(rowIndex, entranceVariant)
    : 0;
  const batchSwap = useBatchCardSwap(batchEditing, reduceMotion, rowIndex);

  return (
    <AnimatedPressable
      collapsable={false}
      pointerEvents={batchEditing ? "box-none" : "auto"}
      android_ripple={Platform.OS === "android" ? { color: "rgba(255,255,255,0.06)" } : undefined}
      onPress={() => {
        if (batchEditing) return;
        void openPredictModal(game);
      }}
      onPressIn={() => {
        if (batchEditing) return;
        if (leagueKey === "nba" && homeTeamId && awayTeamId) {
          prefetchMatchupDetailBundle({
            homeTeamId,
            awayTeamId,
            apiBaseUrl: getUniterzApiBaseUrl(),
          });
        }
        ent.pressed.value = reduceMotion
          ? 1
          : withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        ent.pressed.value = reduceMotion
          ? 0
          : withTiming(0, { duration: 160 });
      }}
      style={[
        styles.gameCardOuter,
        batchEditing ? null : ent.shellTransformStyle,
        useLineFrame && !batchEditing ? ent.shellOpacityStyle : null,
      ]}
    >
      {/*
        測定・パルス枠はカード実寸（Clip）に一致させる。
        外側 View に置くと一覧幅まで伸びて枠がカードより大きく見える。
      */}
      <View
        ref={cardMeasureRef}
        collapsable={false}
        style={rowStyles.cardMeasure}
      >
      <Animated.View style={batchSwap.style}>
      {batchSwap.shown ? (
        <BatchCompactCardNative
          leagueKey={leagueKey}
          homeTeamId={homeTeamId ?? ""}
          awayTeamId={awayTeamId ?? ""}
          homeName={homeCompact}
          awayName={awayCompact}
          borderColor={
            matchLineFramePaint({ pickup: isPickup, predicted: isPredicted }).color
          }
          homeScore={batchEdit?.scores[gameId]?.home ?? ""}
          awayScore={batchEdit?.scores[gameId]?.away ?? ""}
          onHome={(value) => batchEdit?.onChange(gameId, "home", value)}
          onAway={(value) => batchEdit?.onChange(gameId, "away", value)}
          homeAverage={
            homeTeamId ? batchEdit?.teamPpg?.[homeTeamId] : undefined
          }
          awayAverage={
            awayTeamId ? batchEdit?.teamPpg?.[awayTeamId] : undefined
          }
          onDragLock={batchEdit?.onScoreDrag}
          pick={batchEdit?.scorers?.[gameId] ?? null}
          onPick={(pick) => batchEdit?.onScorer?.(gameId, pick)}
          reduceMotion={reduceMotion}
          overrideCandidates={game.topScorerCandidates}
          focused={batchEdit?.focusedId === gameId}
          tieLabel={batchEdit?.tieLabel}
          onToggleFocus={() =>
            batchEdit?.onFocus?.(batchEdit.focusedId === gameId ? null : gameId)
          }
        />
      ) : useLineFrame ? (
        <MatchListLineFrameNative
          predicted={isPredicted}
          pickup={isPickup}
          topLabel={frameLabels.top || undefined}
          leftLabel={frameLabels.left}
          bottomLabel={ctaDisplayLabel}
          animateDraw={lineFrameAnimateDraw}
          drawDelayMs={lineFrameDrawDelayMs}
          leftLabelTutorialTarget={
            registerPickupLabel ? "match-pickup-label" : null
          }
          leftLabelPulse={registerPickupLabel}
        >
          <View style={styles.lineFrameInterior}>
            <Animated.View style={ent.teamsGroupStyle}>
              <View style={styles.matchupGrid}>
                <View style={styles.lineFrameTeamColumn}>
                  <View style={styles.teamTopGroup}>
                    {showSideLabels ? <Text style={styles.sideLabel}>HOME</Text> : null}
                    <Animated.View style={ent.homeJerseyStyle}>
                      <View style={styles.lineFrameTeamMark}>
                        <MatchTeamMarkNative
                          leagueRaw={game.league}
                          side={game.home}
                          palette={homePalette}
                          jerseySize={54}
                          flagVariant="card"
                        />
                      </View>
                    </Animated.View>
                  </View>
                  <View style={styles.teamBottomGroup}>
                    <MatchCardTeamNameNative textStyle={styles.lineFrameTeamName}>
                      {homeCompact}
                    </MatchCardTeamNameNative>
                    <Text style={styles.teamRecordText}>
                      {homeRecordLabel ?? "(0-0-0)"}
                    </Text>
                  </View>
                </View>

                <View style={styles.centerColumn}>
                  <Animated.View style={ent.centerBlockStyle}>
                    <View style={styles.centerScoreWrap}>
                      {centerBlock.variant === "liveMark" ? (
                        <View
                          style={
                            centerBlock.subLine || centerBlock.score
                              ? styles.liveScoreStack
                              : styles.liveMarkWrap
                          }
                        >
                          {centerBlock.score ? null : (
                            <LiveMarkPill
                              pillStyle={styles.liveMarkPill}
                              textStyle={styles.liveMarkText}
                              clock={centerBlock.subLine}
                            />
                          )}
                          {centerBlock.score ? (
                            <View
                              style={[
                                styles.centerTextScoreRow,
                                isWcCard && styles.centerTextScoreRowWc,
                              ]}
                            >
                              <View
                                pointerEvents="none"
                                style={styles.livePillAboveScore}
                              >
                                <LiveMarkPill
                                  pillStyle={styles.liveMarkPill}
                                  textStyle={styles.liveMarkText}
                                  clock={centerBlock.subLine}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.centerTextScoreNum,
                                  isWcCard && styles.centerTextScoreNumWc,
                                ]}
                              >
                                {centerBlock.score.home}
                              </Text>
                              <Text
                                style={[
                                  styles.centerScoreDash,
                                  isWcCard && styles.centerScoreDashWc,
                                ]}
                              >
                                –
                              </Text>
                              <Text
                                style={[
                                  styles.centerTextScoreNum,
                                  isWcCard && styles.centerTextScoreNumWc,
                                ]}
                              >
                                {centerBlock.score.away}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : centerBlock.variant === "score" ? (
                        <View
                          style={[
                            styles.centerTextScoreRow,
                            isWcCard && styles.centerTextScoreRowWc,
                          ]}
                        >
                          <Text
                            style={[
                              styles.centerTextScoreNum,
                              isWcCard && styles.centerTextScoreNumWc,
                            ]}
                          >
                            {centerBlock.home}
                          </Text>
                          <Text
                            style={[
                              styles.centerScoreDash,
                              isWcCard && styles.centerScoreDashWc,
                            ]}
                          >
                            –
                          </Text>
                          <Text
                            style={[
                              styles.centerTextScoreNum,
                              isWcCard && styles.centerTextScoreNumWc,
                            ]}
                          >
                            {centerBlock.away}
                          </Text>
                        </View>
                      ) : batchEditing ? (
                        <BatchCardScorePair
                          home={batchEdit?.scores[gameId]?.home ?? ""}
                          away={batchEdit?.scores[gameId]?.away ?? ""}
                          homeName={homeCompact}
                          awayName={awayCompact}
                          reduceMotion={reduceMotion}
                          onHome={(value) => batchEdit?.onChange(gameId, "home", value)}
                          onAway={(value) => batchEdit?.onChange(gameId, "away", value)}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.centerText,
                            centerBlock.finalLabel && styles.centerTextFinalLabel,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="clip"
                        >
                          {centerBlock.time}
                        </Text>
                      )}
                      {centerBlock.variant === "score" && centerBlock.subLine ? (
                        <Text
                          style={[
                            styles.centerSubline,
                            isWcCard && styles.centerSublineWc,
                          ]}
                          numberOfLines={2}
                        >
                          {centerBlock.subLine}
                        </Text>
                      ) : null}
                      {centerBlock.variant === "score" && centerBlock.pkScore ? (
                        <MatchPkResultLineNative
                          pkScore={centerBlock.pkScore}
                          density="card"
                          wc={isWcCard}
                        />
                      ) : null}
                      {seriesPair != null ? (
                        <PlayoffSeriesScoreInline
                          homeWins={seriesPair.home}
                          awayWins={seriesPair.away}
                          variant="card"
                        />
                      ) : seriesLabel ? (
                        <Text style={styles.seriesText}>{seriesLabel}</Text>
                      ) : null}
                    </View>
                  </Animated.View>
                </View>

                <View style={styles.lineFrameTeamColumn}>
                  <View style={styles.teamTopGroup}>
                    {showSideLabels ? <Text style={styles.sideLabel}>AWAY</Text> : null}
                    <Animated.View style={ent.awayJerseyStyle}>
                      <View style={styles.lineFrameTeamMark}>
                        <MatchTeamMarkNative
                          leagueRaw={game.league}
                          side={game.away}
                          palette={awayPalette}
                          jerseySize={54}
                          flagVariant="card"
                        />
                      </View>
                    </Animated.View>
                  </View>
                  <View style={styles.teamBottomGroup}>
                    <MatchCardTeamNameNative textStyle={styles.lineFrameTeamName}>
                      {awayCompact}
                    </MatchCardTeamNameNative>
                    <Text style={styles.teamRecordText}>
                      {awayRecordLabel ?? "(0-0-0)"}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </MatchListLineFrameNative>
      ) : (
      <MatchListCyberClipNative
        predicted={isPredicted}
        strokeOpacityStyle={ent.borderStrokeStyle}
        gridOpacityStyle={ent.gridLayerStyle}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[ent.shellOpacityStyle, { flex: 1, minHeight: 0, position: "relative" }]}
        >
          {ent.showEntryScan ? (
            <MatchCardEntryScanNative style={ent.scanLineStyle} />
          ) : null}
          <MatchListCyberDecorNative />
          <View style={styles.cardPressableBody}>
          <View style={styles.cardMainContent}>
            <View style={styles.cardFineInteriorContent}>
              <Animated.View style={ent.headerGroupStyle}>
                <View style={styles.cardTopRow}>
                  {roundLabel ? (
                    <Text style={styles.roundLabelText} numberOfLines={1}>
                      {roundLabel}
                    </Text>
                  ) : null}
                </View>
              </Animated.View>
              <Animated.View style={ent.teamsGroupStyle}>
              <View style={styles.matchupGrid}>
                <View style={styles.teamColumn}>
                  <View style={styles.teamTopGroup}>
                    {showSideLabels ? <Text style={styles.sideLabel}>HOME</Text> : null}
                    <Animated.View style={ent.homeJerseyStyle}>
                      <View style={styles.teamMark}>
                        <MatchTeamMarkNative
                          leagueRaw={game.league}
                          side={game.home}
                          palette={homePalette}
                          jerseySize={62}
                          flagVariant="card"
                        />
                      </View>
                    </Animated.View>
                  </View>
                  <View style={styles.teamBottomGroup}>
                    <MatchCardTeamNameNative textStyle={styles.teamNameMain}>
                      {homeCompact}
                    </MatchCardTeamNameNative>
                    <Text style={styles.teamRecordText}>
                      {homeRecordLabel ?? "(0-0-0)"}
                    </Text>
                  </View>
                </View>

                <View style={styles.centerColumn}>
                  <Animated.View style={ent.centerBlockStyle}>
                    <View style={styles.centerScoreWrap}>
                      {centerBlock.variant === "liveMark" ? (
                        <View
                          style={
                            centerBlock.subLine || centerBlock.score
                              ? styles.liveScoreStack
                              : styles.liveMarkWrap
                          }
                        >
                          {centerBlock.score ? null : (
                            <LiveMarkPill
                              pillStyle={styles.liveMarkPill}
                              textStyle={styles.liveMarkText}
                              clock={centerBlock.subLine}
                            />
                          )}
                          {centerBlock.score ? (
                            <View
                              style={[
                                styles.centerTextScoreRow,
                                isWcCard && styles.centerTextScoreRowWc,
                              ]}
                            >
                              <View
                                pointerEvents="none"
                                style={styles.livePillAboveScore}
                              >
                                <LiveMarkPill
                                  pillStyle={styles.liveMarkPill}
                                  textStyle={styles.liveMarkText}
                                  clock={centerBlock.subLine}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.centerTextScoreNum,
                                  isWcCard && styles.centerTextScoreNumWc,
                                ]}
                              >
                                {centerBlock.score.home}
                              </Text>
                              <Text
                                style={[
                                  styles.centerScoreDash,
                                  isWcCard && styles.centerScoreDashWc,
                                ]}
                              >
                                –
                              </Text>
                              <Text
                                style={[
                                  styles.centerTextScoreNum,
                                  isWcCard && styles.centerTextScoreNumWc,
                                ]}
                              >
                                {centerBlock.score.away}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : centerBlock.variant === "score" ? (
                        <View
                          style={[
                            styles.centerTextScoreRow,
                            isWcCard && styles.centerTextScoreRowWc,
                          ]}
                        >
                          <Text
                            style={[
                              styles.centerTextScoreNum,
                              isWcCard && styles.centerTextScoreNumWc,
                            ]}
                          >
                            {centerBlock.home}
                          </Text>
                          <Text
                            style={[
                              styles.centerScoreDash,
                              isWcCard && styles.centerScoreDashWc,
                            ]}
                          >
                            –
                          </Text>
                          <Text
                            style={[
                              styles.centerTextScoreNum,
                              isWcCard && styles.centerTextScoreNumWc,
                            ]}
                          >
                            {centerBlock.away}
                          </Text>
                        </View>
                      ) : batchEditing ? (
                        <BatchCardScorePair
                          home={batchEdit?.scores[gameId]?.home ?? ""}
                          away={batchEdit?.scores[gameId]?.away ?? ""}
                          homeName={homeCompact}
                          awayName={awayCompact}
                          reduceMotion={reduceMotion}
                          onHome={(value) => batchEdit?.onChange(gameId, "home", value)}
                          onAway={(value) => batchEdit?.onChange(gameId, "away", value)}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.centerText,
                            centerBlock.finalLabel && styles.centerTextFinalLabel,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="clip"
                        >
                          {centerBlock.time}
                        </Text>
                      )}
                      {centerBlock.variant === "score" && centerBlock.subLine ? (
                        <Text
                          style={[
                            styles.centerSubline,
                            isWcCard && styles.centerSublineWc,
                          ]}
                          numberOfLines={2}
                        >
                          {centerBlock.subLine}
                        </Text>
                      ) : null}
                      {centerBlock.variant === "score" && centerBlock.pkScore ? (
                        <MatchPkResultLineNative
                          pkScore={centerBlock.pkScore}
                          density="card"
                          wc={isWcCard}
                        />
                      ) : null}
                      {seriesPair != null ? (
                        <PlayoffSeriesScoreInline
                          homeWins={seriesPair.home}
                          awayWins={seriesPair.away}
                          variant="card"
                        />
                      ) : seriesLabel ? (
                        <Text style={styles.seriesText}>{seriesLabel}</Text>
                      ) : null}
                    </View>
                  </Animated.View>
                </View>

                <View style={styles.teamColumn}>
                  <View style={styles.teamTopGroup}>
                    {showSideLabels ? <Text style={styles.sideLabel}>AWAY</Text> : null}
                    <Animated.View style={ent.awayJerseyStyle}>
                      <View style={styles.teamMark}>
                        <MatchTeamMarkNative
                          leagueRaw={game.league}
                          side={game.away}
                          palette={awayPalette}
                          jerseySize={62}
                          flagVariant="card"
                        />
                      </View>
                    </Animated.View>
                  </View>
                  <View style={styles.teamBottomGroup}>
                    <MatchCardTeamNameNative textStyle={styles.teamNameMain}>
                      {awayCompact}
                    </MatchCardTeamNameNative>
                    <Text style={styles.teamRecordText}>
                      {awayRecordLabel ?? "(0-0-0)"}
                    </Text>
                  </View>
                </View>
              </View>
              </Animated.View>
              <View style={styles.leagueDividerWrap}>
                <Animated.View
                  style={[styles.leagueDivider, { backgroundColor: leagueColor }, ent.dividerStyle]}
                />
              </View>
            </View>
          </View>
          <Animated.View style={[styles.cardFooterShell, ent.footerStyle]}>
            <MatchCardListCtaNative label={ctaDisplayLabel} variant={ctaVariant} />
          </Animated.View>
        </View>
        </Animated.View>
      </MatchListCyberClipNative>
      )}
      </Animated.View>
      {/* カード面の後ろに回らないよう、クリップの後・高 zIndex で重ねる */}
      {showTutorialPulse ? (
        <TutorialCardTapHintNative label={tutorialPulseLabel} />
      ) : null}
      </View>
    </AnimatedPressable>
  );
});

function BatchCardScorePair({
  home,
  away,
  homeName,
  awayName,
  reduceMotion,
  onHome,
  onAway,
}: {
  home: string;
  away: string;
  homeName: string;
  awayName: string;
  reduceMotion: boolean;
  onHome: (value: string) => void;
  onAway: (value: string) => void;
}) {
  function digits(value: string) {
    return value.replace(/[^\d]/g, "").slice(0, 3);
  }
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(220)}
      onStartShouldSetResponder={() => true}
      style={batchScoreStyles.row}
    >
      <TextInput
        value={home}
        onChangeText={(value) => onHome(digits(value))}
        keyboardType="number-pad"
        accessibilityLabel={`${homeName} score`}
        style={batchScoreStyles.input}
      />
      <Text style={batchScoreStyles.dash}>–</Text>
      <TextInput
        value={away}
        onChangeText={(value) => onAway(digits(value))}
        keyboardType="number-pad"
        accessibilityLabel={`${awayName} score`}
        style={batchScoreStyles.input}
      />
    </Animated.View>
  );
}

export function GameCardListEmpty({ label }: { label: string }) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={emptyStyles.wrap}
    >
      <Text style={emptyStyles.label}>NO DATA</Text>
    </View>
  );
}

export default function GameCardList(props: GameCardListProps) {
  const { games, t, styles, enteringAnimationEnabled = true, entranceVariant = "full" } = props;
  const tutorialPickupGameId = resolveTutorialPickupGameId(games);

  return (
    <View style={styles.listArea}>
      <View style={styles.listContent}>
        {games.length === 0 ? <GameCardListEmpty label={t.noGames} /> : null}
        {games.map((game, idx) => {
          const rowKey = String(game.id ?? "") || `game-${idx}`;
          return (
            <GameCardListRow
              key={rowKey}
              {...props}
              enteringAnimationEnabled={enteringAnimationEnabled}
              entranceVariant={entranceVariant}
              game={game}
              rowIndex={idx}
              tutorialPickupGameId={tutorialPickupGameId}
            />
          );
        })}
      </View>
    </View>
  );
}

const batchScoreStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  input: {
    width: 36,
    height: 32,
    padding: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "#000000",
    color: "#ffffff",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 18,
    textAlign: "center",
  },
  dash: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
});

const rowStyles = StyleSheet.create({
  /** クリップと同寸。親一覧幅へ伸びないよう width 100% のみ */
  cardMeasure: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
});

/** 試合 0 件 — 中央 NO DATA（枠・説明文なし） */
const emptyStyles = StyleSheet.create({
  wrap: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  label: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 36,
    letterSpacing: 4,
    color: "#5c5c5c",
    includeFontPadding: false,
  },
});
