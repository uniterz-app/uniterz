import { useMemo, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";
import type { GamesTexts } from "./gamesI18n";
import {
  getMatchCardBlueCtaLinearGradient,
  getMatchCardPredictedCtaLinearGradient,
  MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY,
} from "./matchCardCtaGradients";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import type { PredictHeroFromRect } from "./predictHeroTransition";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import {
  LIST_CARD_GRID_LAYER_OPACITY,
  LIST_CARD_GRID_LINE_COLOR,
  shellGridHorizontalLineTopsCentered,
  shellGridVerticalLineLeftsCentered,
} from "./matchCardShellGrid";

type ScreenStyles = Record<string, ViewStyle & TextStyle & ImageStyle>;

const hasNativeBlurView =
  Platform.OS !== "web" &&
  Boolean(
    UIManager.getViewManagerConfig?.("ExpoBlurView") ??
      UIManager.getViewManagerConfig?.("ViewManagerAdapter_ExpoBlur_ExpoBlurView")
  );

function CardBlurLayer({ styles }: { styles: ScreenStyles }) {
  if (!hasNativeBlurView) {
    return <View style={styles.cardBlurLayerFallback} />;
  }
  if (Platform.OS === "ios") {
    return <BlurView intensity={30} tint="default" style={styles.cardBlurLayer} />;
  }
  if (Platform.OS === "android") {
    return (
      <BlurView
        intensity={28}
        tint="default"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.cardBlurLayer}
      />
    );
  }
  return <View style={styles.cardBlurLayerFallback} />;
}

function CardGridOverlay({ styles }: { styles: ScreenStyles }) {
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
    <View pointerEvents="none" style={styles.cardGridOverlay} onLayout={handleLayout}>
      {/** Web MatchCard と同じくレイヤー全体に opacity を掛ける */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { opacity: LIST_CARD_GRID_LAYER_OPACITY }]}
      >
        {verticalLineLeftPx.map((leftPx) => (
          <View
            key={`v-${leftPx}`}
            style={[
              styles.cardGridLineVertical,
              { left: leftPx, backgroundColor: LIST_CARD_GRID_LINE_COLOR },
            ]}
          />
        ))}
        {horizontalLineTopsPx.map((topPx) => (
          <View
            key={`h-${topPx}`}
            style={[
              styles.cardGridLineHorizontal,
              { top: topPx, backgroundColor: LIST_CARD_GRID_LINE_COLOR },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type GameCardListProps = {
  games: Array<Record<string, unknown>>;
  predictedGameIds: Set<string>;
  myPredictionByGameId: Record<
    string,
    {
      winner: "home" | "away" | "draw";
      score: { home: number; away: number };
      comment: string;
      updatedAt?: unknown;
    }
  >;
  language: "ja" | "en";
  t: GamesTexts;
  styles: ScreenStyles;
  openPredictModal: (
    game: Record<string, unknown>,
    fromRect?: PredictHeroFromRect | null
  ) => void;
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
  /** チーム名下の (W-L) 行。モバイル Web の homeRecord/awayRecord 相当 */
  getTeamRecordLabel?: (side: unknown) => string | null;
  resolveTeamJerseyPalette: (
    leagueRaw: unknown,
    side: unknown,
    fallback: string
  ) => { primary: string; secondary: string };
  renderWinnerLabel: (
    winner: "home" | "away" | "draw",
    leagueRaw: unknown
  ) => string;
};

export default function GameCardList(props: GameCardListProps) {
  const {
    games,
    predictedGameIds,
    myPredictionByGameId,
    language,
    t,
    styles,
    openPredictModal,
    resolveGameTeamName,
    toCompactTeamName,
    isSoccerLeague,
    resolveGameStatus,
    isGameStarted,
    resolveLeagueColor,
    getGameCardCenterBlock,
    resolveSeriesLabel,
    resolveSeriesPair,
    getTeamRecordLabel = () => null,
    resolveTeamJerseyPalette,
    renderWinnerLabel,
  } = props;

  const shellRefs = useRef<Record<string, View | null>>({});

  return (
    <View style={styles.listArea}>
      <View style={styles.listContent}>
        {games.length === 0 ? <Text style={styles.body}>{t.noGames}</Text> : null}
        {games.map((game, idx) => {
          const gameId = String(game.id ?? "");
          const isPredicted = predictedGameIds.has(gameId);
          const myPrediction = myPredictionByGameId[gameId];
          const awayName = resolveGameTeamName(game.away, game.awayTeamName, "AWAY");
          const homeName = resolveGameTeamName(game.home, game.homeTeamName, "HOME");
          const awayCompact = toCompactTeamName(game.league, awayName);
          const homeCompact = toCompactTeamName(game.league, homeName);
          const soccer = isSoccerLeague(game.league);
          const status = resolveGameStatus(game);
          const started = isGameStarted(game);
          const leagueColor = resolveLeagueColor(game.league);
          const centerBlock = getGameCardCenterBlock(game);
          const roundLabelRaw = game.roundLabel;
          const roundLabel = typeof roundLabelRaw === "string" ? roundLabelRaw.trim() : "";
          const seriesLabel = resolveSeriesLabel(game);
          const seriesPair = resolveSeriesPair(game);
          const homeRecordLabel = getTeamRecordLabel(game.home);
          const awayRecordLabel = getTeamRecordLabel(game.away);
          const homePalette = resolveTeamJerseyPalette(game.league, game.home, "#ff6b8a");
          const awayPalette = resolveTeamJerseyPalette(game.league, game.away, "#5aa4ff");
          const ctaLabel =
            status === "final"
              ? t.final
              : started
              ? t.live
              : isPredicted
              ? t.predicted
              : t.predict;
          /** MatchCard / MatchCardWeb: final も isPredicted ? predicted : normal（青 radial） */
          const actionFillGradient = isPredicted
            ? getMatchCardPredictedCtaLinearGradient()
            : getMatchCardBlueCtaLinearGradient();

          const rowKey = gameId || `game-${idx}`;
          return (
            <View
              key={rowKey}
              ref={(el) => {
                if (el) shellRefs.current[rowKey] = el;
                else delete shellRefs.current[rowKey];
              }}
              style={[styles.gameCardShell, isPredicted && styles.gameCardShellPredicted]}
              collapsable={false}
            >
              <View pointerEvents="none" style={styles.cardGridUnderlay}>
                <CardGridOverlay styles={styles} />
              </View>
              <Pressable
                style={styles.cardPressableBody}
                onPress={() => {
                  const node = shellRefs.current[rowKey];
                  if (node) {
                    node.measureInWindow((x, y, w, h) => {
                      openPredictModal(game, { x, y, width: w, height: h });
                    });
                  } else {
                    openPredictModal(game, null);
                  }
                }}
              >
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(14,18,28,0.92)",
                  "rgba(10,13,22,0.86)",
                  "rgba(7,10,17,0.92)",
                ]}
                locations={[0, 0.52, 1]}
                style={styles.cardLayerBase}
              />
              <CardBlurLayer styles={styles} />
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.018)",
                  "rgba(255,255,255,0.004)",
                  "rgba(255,255,255,0)",
                ]}
                locations={[0, 0.24, 1]}
                style={styles.cardLayerTopGlow}
              />
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.018)",
                  "rgba(255,255,255,0.008)",
                  "rgba(255,255,255,0)",
                ]}
                locations={[0, 0.6, 1]}
                style={styles.cardLayerGlassFog}
              />
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,255,255,0.012)",
                  "rgba(255,255,255,0.003)",
                  "rgba(255,255,255,0)",
                ]}
                locations={[0, 0.2, 1]}
                style={styles.cardLayerShine}
              />
              <View style={styles.cardGlowOverlay} />
              <View style={styles.cardTopRow}>
                  {roundLabel ? (
                    <Text style={styles.roundLabelText} numberOfLines={1}>
                      {roundLabel}
                    </Text>
                  ) : null}
              </View>
              <View style={styles.matchupGrid}>
                  <View style={styles.teamColumn}>
                  <View style={styles.teamTopGroup}>
                    <Text style={styles.sideLabel}>HOME</Text>
                    <View style={styles.teamMark}>
                      <JerseyMarkAdaptive
                        accent={homePalette.primary}
                        accentEnd={homePalette.secondary}
                        size={48}
                      />
                    </View>
                  </View>
                  <View style={styles.teamBottomGroup}>
                    <Text style={styles.teamNameMain} numberOfLines={1}>
                      {homeCompact}
                    </Text>
                    {homeRecordLabel ? (
                      <Text style={styles.teamRecordText}>{homeRecordLabel}</Text>
                    ) : null}
                  </View>
                  </View>

                  <View style={styles.centerColumn}>
                  <View style={styles.centerScoreWrap}>
                    {centerBlock.variant === "score" ? (
                      <Text style={styles.centerTextScore} numberOfLines={1}>
                        <Text style={styles.centerTextScoreNum}>
                          {centerBlock.home}
                        </Text>
                        <Text style={styles.centerScoreDash}> – </Text>
                        <Text style={styles.centerTextScoreNum}>
                          {centerBlock.away}
                        </Text>
                      </Text>
                    ) : (
                      <Text
                        style={styles.centerText}
                        numberOfLines={1}
                        ellipsizeMode="clip"
                      >
                        {centerBlock.time}
                      </Text>
                    )}
                    {centerBlock.variant === "score" && centerBlock.subLine ? (
                      <Text style={styles.centerSubline} numberOfLines={2}>
                        {centerBlock.subLine}
                      </Text>
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
                  </View>

                  <View style={styles.teamColumn}>
                  <View style={styles.teamTopGroup}>
                    <Text style={styles.sideLabel}>AWAY</Text>
                    <View style={styles.teamMark}>
                      <JerseyMarkAdaptive
                        accent={awayPalette.primary}
                        accentEnd={awayPalette.secondary}
                        size={48}
                      />
                    </View>
                  </View>
                  <View style={styles.teamBottomGroup}>
                    <Text style={styles.teamNameMain} numberOfLines={1}>
                      {awayCompact}
                    </Text>
                    {awayRecordLabel ? (
                      <Text style={styles.teamRecordText}>{awayRecordLabel}</Text>
                    ) : null}
                  </View>
                  </View>
              </View>
              <View style={[styles.leagueDivider, { backgroundColor: leagueColor }]} />
              <View
                style={[
                  styles.cardAction,
                  status === "final" && styles.cardActionFinal,
                  isPredicted && styles.cardActionPredicted,
                  started && status !== "final" && !isPredicted && styles.cardActionLive,
                  status !== "final" &&
                    !started &&
                    !isPredicted &&
                    styles.cardActionPredictPrimary,
                ]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={actionFillGradient.colors}
                  locations={actionFillGradient.locations}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cardActionFill}
                />
                {!isPredicted ? (
                  <LinearGradient
                    pointerEvents="none"
                    colors={[...MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY.blue.colors]}
                    locations={[...MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY.blue.locations]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.cardActionFill, styles.cardActionMcVerticalLayer]}
                  />
                ) : null}
                {isPredicted ? (
                  <LinearGradient
                    pointerEvents="none"
                    colors={[...MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY.gray.colors]}
                    locations={[...MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY.gray.locations]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={[styles.cardActionFill, styles.cardActionMcVerticalLayerGray]}
                  />
                ) : null}
                <View pointerEvents="none" style={styles.cardActionHairlineTop} />
                <View pointerEvents="none" style={styles.cardActionHairlineBottom} />
                <Text
                  style={[
                    styles.cardActionText,
                    status === "final" && styles.cardActionTextFinal,
                  ]}
                >
                  {soccer && !started && !isPredicted
                    ? `${ctaLabel} / ${t.drawAvailable}`
                    : ctaLabel}
                </Text>
              </View>
              {myPrediction ? (
                <Text style={styles.cardMyPredictionText} numberOfLines={1}>
                  {t.myPick}: {renderWinnerLabel(myPrediction.winner, game.league)} /{" "}
                  {myPrediction.score.home} – {myPrediction.score.away}
                </Text>
              ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
