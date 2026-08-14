import { Platform, Pressable, StyleSheet, Text, View, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { memo, useEffect, useMemo, useRef } from "react";
import { registerTutorialTarget } from "../tutorial/tutorialMeasureNative";
import Animated, { useReducedMotion, withTiming } from "react-native-reanimated";
import type { TeamRecordSnapshot } from "./teamRecordDisplay";
import MatchTeamMarkNative from "./MatchTeamMarkNative";
import type { GamesTexts } from "./gamesI18n";
import type { GameCardCenterBlock } from "./gameCardCenterTypes";
import { LiveMarkPill } from "./LiveMarkPill";
import MatchPkResultLineNative from "./MatchPkResultLineNative";
import { PlayoffSeriesScoreInline } from "./PlayoffSeriesScoreInline";
import MatchListCyberClipNative from "./MatchListCyberClipNative";
import MatchListCyberDecorNative from "./MatchListCyberDecorNative";
import MatchListLineFrameNative from "./MatchListLineFrameNative";
import { isNbaPickupGame } from "../../../../../lib/nba/isPickupGame";
import MatchCardListCtaNative, {
  type MatchCardListCtaVariant,
} from "./MatchCardListCtaNative";
import MatchCardEntryScanNative from "./MatchCardEntryScanNative";
import {
  useGameCardListRowEntrance,
  type GameCardEntranceVariant,
} from "./useGameCardListRowEntrance";
import TutorialCardTapHintNative from "../tutorial/TutorialCardTapHintNative";
import { MATCH_CARD_DISPLAY_FONT } from "./matchCardTypography";

function matchRoundSideCode(roundLabel: string): string {
  const u = roundLabel.toUpperCase();
  if (u.includes("PLAYOFF") || u.includes("プレーオフ")) return "PO";
  if (u.includes("PLAY-IN") || u.includes("PLAY IN") || u.includes("プレーイン")) {
    return "PI";
  }
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
  /** `lineFrame` = 塗りなし・上下ラベルで途切れた線枠。本番一覧の既定 */
  shellVariant?: "cyber" | "lineFrame";
  /** ピックアップ表記。本番は左辺 `PICK UP` */
  pickupMark?: "top" | "left";
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
const GameCardListRow = memo(function GameCardListRow(props: GameCardListRowProps) {
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
    shellVariant = "lineFrame",
    pickupMark = "left",
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
  const roundLabel = typeof roundLabelRaw === "string" ? roundLabelRaw.trim() : "";
  const isPickup = isNbaPickupGame(game);
  const frameLabels = resolveLineFrameLabels(roundLabel, isPickup, pickupMark);
  const isKnockout = false;
  const seriesLabel = resolveSeriesLabel(game);
  const seriesPair = resolveSeriesPair(game);
  const homeRecordLabel = getTeamRecordLabel(game.home, game.league);
  const awayRecordLabel = getTeamRecordLabel(game.away, game.league);
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
      {/*
        測定・パルス枠はカード実寸（Clip）に一致させる。
        外側 View に置くと一覧幅まで伸びて枠がカードより大きく見える。
      */}
      <View
        ref={cardMeasureRef}
        collapsable={false}
        style={rowStyles.cardMeasure}
      >
      {useLineFrame ? (
        <MatchListLineFrameNative
          predicted={isPredicted}
          pickup={isPickup}
          topLabel={frameLabels.top || undefined}
          leftLabel={frameLabels.left}
          bottomLabel={ctaDisplayLabel}
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
                    <Text style={styles.lineFrameTeamName} numberOfLines={1}>
                      {homeCompact}
                    </Text>
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
                            centerBlock.subLine
                              ? styles.liveScoreStack
                              : styles.liveMarkWrap
                          }
                        >
                          <LiveMarkPill
                            pillStyle={styles.liveMarkPill}
                            textStyle={styles.liveMarkText}
                          />
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
                    <Text style={styles.lineFrameTeamName} numberOfLines={1}>
                      {awayCompact}
                    </Text>
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
                    <Text style={styles.teamNameMain} numberOfLines={1}>
                      {homeCompact}
                    </Text>
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
                            centerBlock.subLine
                              ? styles.liveScoreStack
                              : styles.liveMarkWrap
                          }
                        >
                          <LiveMarkPill
                            pillStyle={styles.liveMarkPill}
                            textStyle={styles.liveMarkText}
                          />
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
                    <Text style={styles.teamNameMain} numberOfLines={1}>
                      {awayCompact}
                    </Text>
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
      {/* カード面の後ろに回らないよう、クリップの後・高 zIndex で重ねる */}
      {showTutorialPulse ? (
        <TutorialCardTapHintNative label={tutorialPulseLabel} />
      ) : null}
      </View>
    </AnimatedPressable>
  );
});

export default function GameCardList(props: GameCardListProps) {
  const { games, t, styles, enteringAnimationEnabled = true, entranceVariant = "full" } = props;

  return (
    <View style={styles.listArea}>
      <View style={styles.listContent}>
        {games.length === 0 ? (
          <View
            accessibilityRole="text"
            accessibilityLabel={t.noGames}
            style={emptyStyles.wrap}
          >
            <Text style={emptyStyles.label}>NO DATA</Text>
          </View>
        ) : null}
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
