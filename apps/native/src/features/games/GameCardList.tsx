import { Platform, Pressable, Text, View, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useReducedMotion, withTiming } from "react-native-reanimated";
import MatchTeamMarkNative from "./MatchTeamMarkNative";
import type { GamesTexts } from "./gamesI18n";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import { LiveMarkPill } from "./LiveMarkPill";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import MatchListCyberClipNative from "./MatchListCyberClipNative";
import MatchListCyberDecorNative from "./MatchListCyberDecorNative";
import MatchListCyberGridNative from "./MatchListCyberGridNative";
import MatchCardListCtaNative, {
  type MatchCardListCtaVariant,
} from "./MatchCardListCtaNative";
import MatchCardEntryScanNative from "./MatchCardEntryScanNative";
import {
  useGameCardListRowEntrance,
  type GameCardEntranceVariant,
} from "./useGameCardListRowEntrance";
type ScreenStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

type GameCardListProps = {
  games: Array<Record<string, unknown>>;
  /** false のときは日付切替などでカードの入場アニメを付けない（再マウント時のがたつき防止） */
  enteringAnimationEnabled?: boolean;
  /** `light` = 日付変更時の簡易入場（フル cyber reveal は初回・リーグ切替のみ） */
  entranceVariant?: GameCardEntranceVariant;
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
  /** チーム名下の (W-L) / (W-D-L) 行。モバイル Web の homeRecord/awayRecord 相当 */
  getTeamRecordLabel?: (side: unknown, leagueRaw?: unknown) => string | null;
  resolveTeamJerseyPalette: (
    leagueRaw: unknown,
    side: unknown,
    fallback: string
  ) => { primary: string; secondary: string };
};

type GameCardListRowProps = GameCardListProps & {
  game: Record<string, unknown>;
  /** ページ表示時の入場スタッガー用 */
  rowIndex: number;
  enteringAnimationEnabled: boolean;
  entranceVariant: GameCardEntranceVariant;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** 試合一覧行：Reanimated による depth reveal / bottom-up 入場 */
function GameCardListRow(props: GameCardListRowProps) {
  const {
    game,
    rowIndex,
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
    enteringAnimationEnabled,
    entranceVariant,
  } = props;

  const reduceMotion = useReducedMotion() ?? false;
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
  const leagueKey = String(game.league ?? "").toLowerCase();
  const showSideLabels = leagueKey !== "wc";
  const isWcCard = leagueKey === "wc";
  const centerBlock = getGameCardCenterBlock(game);
  const roundLabelRaw = game.roundLabel;
  const roundLabel = typeof roundLabelRaw === "string" ? roundLabelRaw.trim() : "";
  const seriesLabel = resolveSeriesLabel(game);
  const seriesPair = resolveSeriesPair(game);
  const homeRecordLabel = getTeamRecordLabel(game.home, game.league);
  const awayRecordLabel = getTeamRecordLabel(game.away, game.league);
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
  const ctaVariant: MatchCardListCtaVariant =
    status === "final"
      ? "final"
      : started
      ? "live"
      : isPredicted
      ? "predicted"
      : "normal";
  const ctaDisplayLabel =
    soccer && !started && !isPredicted
      ? `${ctaLabel} / ${t.drawAvailable}`
      : ctaLabel;

  const showPredictPrimaryGlow =
    status !== "final" && !started && !isPredicted;

  const ent = useGameCardListRowEntrance({
    rowIndex,
    enteringAnimationEnabled,
    reduceMotion,
    entranceVariant,
    isPredicted,
    showPredictPrimaryGlow,
  });

  return (
    <AnimatedPressable
      collapsable={false}
      android_ripple={Platform.OS === "android" ? { color: "rgba(255,255,255,0.06)" } : undefined}
      onPress={() => void openPredictModal(game)}
      onPressIn={() => {
        if (reduceMotion) return;
        ent.pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        if (reduceMotion) return;
        ent.pressed.value = withTiming(0, { duration: 160 });
      }}
      style={[styles.gameCardOuter, ent.shellTransformStyle]}
    >
      <MatchListCyberClipNative
        predicted={isPredicted}
        strokeOpacityStyle={ent.borderStrokeStyle}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[ent.shellOpacityStyle, { flex: 1, minHeight: 0, position: "relative" }]}
        >
          <MatchCardEntryScanNative style={ent.scanLineStyle} />
          <Animated.View pointerEvents="none" style={[styles.cardFineShellBackdrop, ent.gridLayerStyle]}>
            <MatchListCyberGridNative />
          </Animated.View>
          <MatchListCyberDecorNative />
          <View style={styles.cardPressableBody}>
          <View style={{ flex: 1, minHeight: 0 }}>
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
                      <View style={isWcCard ? styles.teamMarkFlag : styles.teamMark}>
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
                    <Text
                      style={[styles.teamNameMain, isWcCard && styles.teamNameMainWc]}
                      numberOfLines={1}
                    >
                      {homeCompact}
                    </Text>
                    <Text style={styles.teamRecordText}>{homeRecordLabel ?? "(0-0)"}</Text>
                  </View>
                </View>

                <View style={styles.centerColumn}>
                  <Animated.View style={ent.centerBlockStyle}>
                    <View style={styles.centerScoreWrap}>
                      {centerBlock.variant === "liveMark" ? (
                        <View style={styles.liveMarkWrap}>
                          <LiveMarkPill
                            pillStyle={styles.liveMarkPill}
                            textStyle={styles.liveMarkText}
                          />
                        </View>
                      ) : centerBlock.variant === "liveScore" ? (
                        <View style={styles.liveScoreStack}>
                          <LiveMarkPill
                            pillStyle={styles.liveMarkPill}
                            textStyle={styles.liveMarkText}
                          />
                          <Text
                            style={[
                              styles.centerTextScore,
                              isWcCard && styles.centerTextScoreWc,
                            ]}
                            numberOfLines={1}
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
                          </Text>
                          {centerBlock.subLine ? (
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
                        </View>
                      ) : centerBlock.variant === "score" ? (
                        <Text
                          style={[
                            styles.centerTextScore,
                            isWcCard && styles.centerTextScoreWc,
                          ]}
                          numberOfLines={1}
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
                        </Text>
                      ) : (
                        <Text style={styles.centerText} numberOfLines={1} ellipsizeMode="clip">
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
                      <View style={isWcCard ? styles.teamMarkFlag : styles.teamMark}>
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
                    <Text
                      style={[styles.teamNameMain, isWcCard && styles.teamNameMainWc]}
                      numberOfLines={1}
                    >
                      {awayCompact}
                    </Text>
                    <Text style={styles.teamRecordText}>{awayRecordLabel ?? "(0-0)"}</Text>
                  </View>
                </View>
              </View>
              </Animated.View>
              <View style={{ width: "100%", marginTop: "auto" }}>
                <Animated.View
                  style={[styles.leagueDivider, { backgroundColor: leagueColor }, ent.dividerStyle]}
                />
              </View>
            </View>
          </View>
          <Animated.View style={ent.footerStyle}>
            <MatchCardListCtaNative label={ctaDisplayLabel} variant={ctaVariant} />
          </Animated.View>
        </View>
        </Animated.View>
      </MatchListCyberClipNative>
    </AnimatedPressable>
  );
}

export default function GameCardList(props: GameCardListProps) {
  const { games, t, styles, enteringAnimationEnabled = true, entranceVariant = "full" } = props;

  return (
    <View style={styles.listArea}>
      <View style={styles.listContent}>
        {games.length === 0 ? <Text style={styles.body}>{t.noGames}</Text> : null}
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
            />
          );
        })}
      </View>
    </View>
  );
}
