/** まとめて入力の簡素カード。NBA は両チーム合わせた得点上位4人 */
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  nbaTopScorerSegmentLabel,
  normalizeNbaTopScorerCandidates,
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "../../../../../lib/nba/topScorer";
import { useNbaTopScorerCandidates } from "../../../../../lib/nba/useNbaTopScorerCandidates";
import { getTeamRosterMarkColor } from "../../../../../lib/team-colors";
import {
  CYBER_TAB_CYAN,
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import { MATCH_CARD_DISPLAY_FONT } from "./matchCardTypography";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

const TOP_BOTH_TEAMS = 4;

type Props = {
  leagueKey: string;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  borderColor: string;
  homeScore: string;
  awayScore: string;
  onHome: (value: string) => void;
  onAway: (value: string) => void;
  /** チームの平均得点。スロットの初期位置 */
  homeAverage?: number;
  awayAverage?: number;
  /** 得点リール操作中は親リストのスクロールを止める */
  onDragLock?: (locked: boolean) => void;
  pick: NbaTopScorerPick | null;
  onPick: (pick: NbaTopScorerPick | null) => void;
  reduceMotion: boolean;
  overrideCandidates?: unknown;
  /** 選択中のカードだけ得点リールが動く（それ以外は一覧のスクロールを優先） */
  focused?: boolean;
  onToggleFocus?: () => void;
  /** 同点で提出できないときの短い文言（NBA） */
  tieLabel?: string;
};

export default function BatchCompactCardNative({
  leagueKey,
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  borderColor,
  homeScore,
  awayScore,
  onHome,
  onAway,
  homeAverage,
  awayAverage,
  onDragLock,
  pick,
  onPick,
  reduceMotion,
  overrideCandidates,
  focused = false,
  onToggleFocus,
  tieLabel,
}: Props) {
  const nba = leagueKey === "nba" && !!homeTeamId && !!awayTeamId;
  const frameColor = focused ? CYBER_TAB_CYAN : borderColor;
  const scores = (
    <BatchCardScorePair
      home={homeScore}
      away={awayScore}
      homeName={homeName}
      awayName={awayName}
      homeAverage={homeAverage}
      awayAverage={awayAverage}
      onDragLock={onDragLock}
      slot={nba}
      active={focused}
      tieLabel={tieLabel}
      reduceMotion={reduceMotion}
      onHome={onHome}
      onAway={onAway}
    />
  );
  if (!nba) {
    return (
      <View style={[styles.card, { borderColor }]}>
        <Text style={[styles.team, styles.teamFlex]} numberOfLines={1}>
          {homeName}
        </Text>
        {scores}
        <Text style={[styles.team, styles.teamFlex]} numberOfLines={1}>
          {awayName}
        </Text>
      </View>
    );
  }
  return (
    <BatchNbaCard
      homeTeamId={homeTeamId}
      awayTeamId={awayTeamId}
      homeName={homeName}
      awayName={awayName}
      borderColor={frameColor}
      focused={focused}
      onToggleFocus={onToggleFocus}
      pick={pick}
      onPick={onPick}
      overrideCandidates={overrideCandidates}
      scores={scores}
    />
  );
}

function BatchNbaCard({
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  borderColor,
  focused,
  onToggleFocus,
  pick,
  onPick,
  overrideCandidates,
  scores,
}: {
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  borderColor: string;
  focused: boolean;
  onToggleFocus?: () => void;
  pick: NbaTopScorerPick | null;
  onPick: (pick: NbaTopScorerPick | null) => void;
  overrideCandidates?: unknown;
  scores: ReactNode;
}) {
  const override = useMemo(
    () => normalizeNbaTopScorerCandidates(overrideCandidates),
    [overrideCandidates]
  );
  const { candidates, loading } = useNbaTopScorerCandidates({
    homeTeamId,
    awayTeamId,
    apiBaseUrl: getUniterzApiBaseUrl(),
    override: override.length > 0 ? override : null,
    enabled: true,
  });
  const top = useMemo(
    () => sortNbaTopScorerCandidatesByPpg(candidates).slice(0, TOP_BOTH_TEAMS),
    [candidates]
  );

  return (
    <Pressable
      onPress={onToggleFocus}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${homeName} vs ${awayName}`}
      style={[styles.card, styles.cardNba, focused && styles.cardFocused, { borderColor }]}
    >
      <View style={styles.nameRow}>
        <Text style={[styles.team, styles.teamFlex]} numberOfLines={1}>
          {homeName}
        </Text>
        {scores}
        <Text style={[styles.team, styles.teamFlex]} numberOfLines={1}>
          {awayName}
        </Text>
      </View>
      <ScorerNames
        players={top}
        loading={loading}
        pick={pick}
        onPick={onPick}
      />
    </Pressable>
  );
}

function ScorerNames({
  players,
  loading,
  pick,
  onPick,
}: {
  players: NbaTopScorerCandidate[];
  loading: boolean;
  pick: NbaTopScorerPick | null;
  onPick: (pick: NbaTopScorerPick | null) => void;
}) {
  if (!loading && players.length === 0) return null;
  const slots =
    players.length > 0
      ? players
      : Array.from({ length: TOP_BOTH_TEAMS }, () => null);
  return (
    <View style={styles.scorerRow}>
    <CyberSlantedTabBarNative fill>
      {slots.map((player, index) => {
        if (!player) {
          return (
            <CyberSlantedTabNative
              key={`slot-${index}`}
              label="—"
              active={false}
              compact
              onPress={() => {}}
            />
          );
        }
        const selected =
          pick?.playerId === player.playerId && pick.teamId === player.teamId;
        const teamColor = getTeamRosterMarkColor("nba", player.teamId);
        return (
          <CyberSlantedTabNative
            key={`${player.teamId}:${player.playerId}`}
            label={nbaTopScorerSegmentLabel(player.name)}
            active={selected}
            compact
            theme={{
              accent: CYBER_TAB_CYAN,
              inactiveText: CYBER_TAB_CYAN,
              inactiveBorder: teamColor,
            }}
            onPress={() =>
              onPick(
                selected
                  ? null
                  : {
                      playerId: player.playerId,
                      teamId: player.teamId,
                      name: player.name,
                    }
              )
            }
          />
        );
      })}
    </CyberSlantedTabBarNative>
    </View>
  );
}

const SCORE_MIN = 70;
const SCORE_MAX = 150;
/** 勝ち側の得点。予想画面の勝ち色と同じ */
const WIN_SCORE = "#F5C518";
const SLOT_ITEM = 22;
/** 選択中（ドラッグ前）のリール枠の光り具合 */
const FOCUS_GLOW = 0.6;
/** 未確定（平均得点の目安表示）の数字 */
const UNCONFIRMED_SCORE = "rgba(255,255,255,0.38)";
const SLOT_H = 58;
const SLOT_PAD = (SLOT_H - SLOT_ITEM) / 2;
const SCORE_VALUES = Array.from(
  { length: SCORE_MAX - SCORE_MIN + 1 },
  (_, index) => SCORE_MIN + index
);

function clampScore(value: number) {
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, value));
}

function scoreFromText(value: string, fallback?: number) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= SCORE_MIN && parsed <= SCORE_MAX) {
    return parsed;
  }
  if (fallback != null && Number.isFinite(fallback)) {
    return clampScore(Math.round(fallback));
  }
  return 110;
}

function ScoreSlot({
  value,
  fallback,
  score,
  opponent,
  onChange,
  onDragLock,
  onActiveChange,
  enabled,
  confirmed,
  reduceMotion,
}: {
  value: string;
  fallback?: number;
  score: SharedValue<number>;
  opponent: SharedValue<number>;
  /** 指を離した位置で確定（未入力でも触れたら今の数字で決まる） */
  onChange: (value: string) => void;
  onDragLock?: (locked: boolean) => void;
  onActiveChange?: (active: boolean) => void;
  /** false のあいだは触れても掴まない（タッチはカードの選択・一覧のスクロールへ） */
  enabled: boolean;
  /** 両チームとも決まっている。未確定のあいだは平均得点を薄く出すだけ（提出に入らない） */
  confirmed: boolean;
  reduceMotion: boolean;
}) {
  const shown = scoreFromText(value, fallback);
  const dragging = useRef(false);
  const listLocked = useRef(false);
  const grantY = useRef(0);
  const originScore = useRef(shown);
  const targetScore = useRef(shown);
  const handlers = useRef({ onChange, onDragLock, onActiveChange, value, enabled });
  handlers.current = { onChange, onDragLock, onActiveChange, value, enabled };

  useEffect(() => {
    if (dragging.current) return;
    if (shown === targetScore.current) return;
    targetScore.current = shown;
    score.value = shown;
  }, [shown, score]);

  function setListLocked(locked: boolean) {
    if (listLocked.current === locked) return;
    listLocked.current = locked;
    handlers.current.onDragLock?.(locked);
    handlers.current.onActiveChange?.(locked);
  }

  function applyDrag(pageY: number) {
    const dy = pageY - grantY.current;
    score.value = clampScore(originScore.current - dy / SLOT_ITEM);
  }

  function endDrag() {
    if (!dragging.current) return;
    dragging.current = false;
    const snapped = clampScore(Math.round(score.value));
    targetScore.current = snapped;
    score.value = reduceMotion ? snapped : withTiming(snapped, { duration: 140 });
    setListLocked(false);
    if (String(snapped) !== handlers.current.value) {
      handlers.current.onChange(String(snapped));
    }
  }

  const reelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -(score.value - SCORE_MIN) * SLOT_ITEM }],
  }));
  const numStyle = useAnimatedStyle(
    () => ({
      color: !confirmed
        ? UNCONFIRMED_SCORE
        : score.value > opponent.value
          ? WIN_SCORE
          : "#ffffff",
    }),
    [confirmed]
  );

  return (
    <View
      collapsable={false}
      style={styles.slot}
      accessibilityRole="adjustable"
      accessibilityLabel={String(shown)}
      accessibilityState={{ disabled: !enabled }}
      onStartShouldSetResponder={() => handlers.current.enabled}
      onMoveShouldSetResponder={() => handlers.current.enabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        dragging.current = true;
        grantY.current = event.nativeEvent.pageY;
        originScore.current = score.value;
        setListLocked(true);
      }}
      onResponderMove={(event) => {
        applyDrag(event.nativeEvent.pageY);
      }}
      onResponderRelease={endDrag}
      onResponderTerminate={endDrag}
    >
      <Animated.View style={[styles.slotReel, reelStyle]} pointerEvents="none">
        {SCORE_VALUES.map((num) => (
          <Animated.Text key={num} style={[styles.slotNum, numStyle]}>
            {num}
          </Animated.Text>
        ))}
      </Animated.View>
      <LinearGradient
        pointerEvents="none"
        colors={["#000000", "rgba(0,0,0,0)"]}
        style={styles.slotFadeTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(0,0,0,0)", "#000000"]}
        style={styles.slotFadeBottom}
      />
    </View>
  );
}

function BatchCardScorePair({
  home,
  away,
  homeName,
  awayName,
  homeAverage,
  awayAverage,
  onDragLock,
  slot,
  active,
  tieLabel,
  reduceMotion,
  onHome,
  onAway,
}: {
  home: string;
  away: string;
  homeName: string;
  awayName: string;
  homeAverage?: number;
  awayAverage?: number;
  onDragLock?: (locked: boolean) => void;
  slot: boolean;
  /** 選択中のカード。リールが動き、枠がシアンに寄る */
  active: boolean;
  /** 同点で提出できないときに枠の下へ出す短い文言 */
  tieLabel?: string;
  reduceMotion: boolean;
  onHome: (value: string) => void;
  onAway: (value: string) => void;
}) {
  function digits(value: string) {
    return value.replace(/[^\d]/g, "").slice(0, 3);
  }
  const homeLive = useSharedValue(scoreFromText(home, homeAverage));
  const awayLive = useSharedValue(scoreFromText(away, awayAverage));
  const glow = useSharedValue(active ? FOCUS_GLOW : 0);
  const glowLocks = useRef(0);
  const boxStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      glow.value,
      [0, 1],
      ["rgba(255,255,255,0.4)", "#00F5FF"]
    ),
    shadowOpacity: glow.value * 0.9,
  }));
  /** ドラッグ中 1、選択中 FOCUS_GLOW、それ以外 0 */
  function glowTarget() {
    return glowLocks.current > 0 ? 1 : active ? FOCUS_GLOW : 0;
  }
  useEffect(() => {
    glow.value = reduceMotion ? glowTarget() : withTiming(glowTarget(), { duration: 160 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduceMotion]);
  function onActiveChange(dragging: boolean) {
    glowLocks.current = Math.max(0, glowLocks.current + (dragging ? 1 : -1));
    glow.value = withTiming(glowTarget(), { duration: 120 });
  }
  if (slot) {
    const confirmed = home.trim() !== "" && away.trim() !== "";
    const tie = confirmed && Number(home) === Number(away);
    // 片方だけ決まると提出に入らないので、触れた時点で相手側も見えている数字で確定する
    const commitHome = (value: string) => {
      onHome(value);
      if (away.trim() === "") onAway(String(clampScore(Math.round(awayLive.value))));
    };
    const commitAway = (value: string) => {
      onAway(value);
      if (home.trim() === "") onHome(String(clampScore(Math.round(homeLive.value))));
    };
    return (
      <View style={styles.scoreBoxWrap}>
        <Animated.View style={[styles.scoreBox, boxStyle]}>
          <ScoreSlot
            value={home}
            fallback={homeAverage}
            score={homeLive}
            opponent={awayLive}
            onChange={commitHome}
            onDragLock={onDragLock}
            onActiveChange={onActiveChange}
            enabled={active}
            confirmed={confirmed}
            reduceMotion={reduceMotion}
          />
          <View style={styles.dash} />
          <ScoreSlot
            value={away}
            fallback={awayAverage}
            score={awayLive}
            opponent={homeLive}
            onChange={commitAway}
            onDragLock={onDragLock}
            onActiveChange={onActiveChange}
            enabled={active}
            confirmed={confirmed}
            reduceMotion={reduceMotion}
          />
        </Animated.View>
        {tie && tieLabel ? (
          <Text style={styles.tieLabel} accessibilityLiveRegion="polite">
            {tieLabel}
          </Text>
        ) : null}
      </View>
    );
  }
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(220)}
      onStartShouldSetResponder={() => true}
      style={styles.scoreRow}
    >
      <TextInput
        value={home}
        onChangeText={(value) => onHome(digits(value))}
        keyboardType="number-pad"
        accessibilityLabel={`${homeName} score`}
        style={styles.input}
      />
      <View style={styles.dash} />
      <TextInput
        value={away}
        onChangeText={(value) => onAway(digits(value))}
        keyboardType="number-pad"
        accessibilityLabel={`${awayName} score`}
        style={styles.input}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    backgroundColor: "transparent",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 92,
  },
  cardFocused: {
    borderWidth: 1.5,
  },
  /** 名前とスコアを上段、その下に両チーム上位4人 */
  cardNba: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingTop: 16,
    paddingBottom: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  team: {
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "600",
    fontFamily: "Oxanium_600SemiBold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  teamFlex: {
    flex: 1,
  },
  scorerRow: {
    marginTop: 10,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "transparent",
    paddingHorizontal: 4,
  },
  input: {
    width: 56,
    height: 28,
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
    width: 18,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  scoreBoxWrap: {
    position: "relative",
  },
  tieLabel: {
    position: "absolute",
    top: SLOT_H + 3,
    left: -12,
    right: -12,
    textAlign: "center",
    color: "#F87171",
    fontSize: 9,
    lineHeight: 11,
    fontFamily: "Oxanium_700Bold",
    letterSpacing: 1.2,
  },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
    height: SLOT_H,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 4,
    shadowColor: "#00F5FF",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
  },
  slot: {
    width: 56,
    height: SLOT_H,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  slotReel: {
    position: "absolute",
    top: SLOT_PAD,
    left: 0,
    right: 0,
  },
  slotFadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 16,
  },
  slotFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
  },
  slotNum: {
    height: SLOT_ITEM,
    lineHeight: SLOT_ITEM,
    textAlign: "center",
    fontSize: 18,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
});
