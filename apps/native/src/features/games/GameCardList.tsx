import { Platform, Pressable, StyleSheet, Text, View, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";
import type { GamesTexts } from "./gamesI18n";
import {
  getMatchCardBlueCtaLinearGradient,
  getMatchCardPredictedCtaLinearGradient,
  MATCH_CARD_CTA_VERTICAL_DIM_OVERLAY,
} from "./matchCardCtaGradients";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import { LiveMarkPill } from "./LiveMarkPill";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import { MatchCardFineBackdrop } from "./MatchCardFineInterior";
type ScreenStyles = Record<string, ViewStyle & TextStyle & ImageStyle>;

type GameCardListProps = {
  games: Array<Record<string, unknown>>;
  predictedGameIds: Set<string>;
  language: "ja" | "en";
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
  /** チーム名下の (W-L) 行。モバイル Web の homeRecord/awayRecord 相当 */
  getTeamRecordLabel?: (side: unknown) => string | null;
  resolveTeamJerseyPalette: (
    leagueRaw: unknown,
    side: unknown,
    fallback: string
  ) => { primary: string; secondary: string };
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GameCardListRowProps = GameCardListProps & {
  game: Record<string, unknown>;
};

function GameCardListRow(props: GameCardListRowProps) {
  const {
    game,
    predictedGameIds,
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
  } = props;

  const reduceMotion = useReducedMotion() ?? false;
  const pressedLift = useSharedValue(0);

  const cardPressLiftStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }
    const y = interpolate(pressedLift.value, [0, 1], [0, -3]);
    const s = interpolate(pressedLift.value, [0, 1], [1, 1.02]);
    const shadowOp = interpolate(pressedLift.value, [0, 1], [0.55, 0.72]);
    const shadowRad = interpolate(pressedLift.value, [0, 1], [20, 28]);
    const el = interpolate(pressedLift.value, [0, 1], [7, 12]);
    return {
      transform: [{ translateY: y }, { scale: s }],
      shadowOpacity: shadowOp,
      shadowRadius: shadowRad,
      elevation: el,
    };
  });

  const gameId = String(game.id ?? "");
  const isPredicted = predictedGameIds.has(gameId);
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

  return (
    <AnimatedPressable
      collapsable={false}
      android_ripple={Platform.OS === "android" ? { color: "rgba(255,255,255,0.06)" } : undefined}
      onPress={() => void openPredictModal(game)}
      onPressIn={() => {
        if (reduceMotion) {
          return;
        }
        pressedLift.value = withTiming(1, { duration: 180 });
      }}
      onPressOut={() => {
        if (reduceMotion) {
          return;
        }
        pressedLift.value = withTiming(0, { duration: 220 });
      }}
      style={[
        styles.gameCardShell,
        isPredicted && styles.gameCardShellPredicted,
        cardPressLiftStyle,
      ]}
    >
              <View pointerEvents="none" style={styles.cardFineShellBackdrop}>
                <MatchCardFineBackdrop />
              </View>
              <View style={styles.cardPressableBody}>
              <View style={{ flex: 1, minHeight: 0 }}>
              <View style={styles.cardFineInteriorContent}>
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
                    {centerBlock.variant === "liveMark" ? (
                      <View style={styles.liveMarkWrap}>
                        <LiveMarkPill
                          pillStyle={styles.liveMarkPill}
                          textStyle={styles.liveMarkText}
                        />
                      </View>
                    ) : centerBlock.variant === "score" ? (
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
              </View>
              </View>
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
              </View>
    </AnimatedPressable>
  );
}

export default function GameCardList(props: GameCardListProps) {
  const { games, t, styles } = props;

  return (
    <View style={styles.listArea}>
      <View style={styles.listContent}>
        {games.length === 0 ? <Text style={styles.body}>{t.noGames}</Text> : null}
        {games.map((game, idx) => {
          const rowKey = String(game.id ?? "") || `game-${idx}`;
          return <GameCardListRow key={rowKey} {...props} game={game} />;
        })}
      </View>
    </View>
  );
}
