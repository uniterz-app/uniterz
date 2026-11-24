/** その日の未入力を1画面に積む。スコアは触った試合だけ確定し、NBA は最多得点も同じ塊で選ぶ */
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  normalizeNbaTopScorerCandidates,
  type NbaTopScorerPick,
} from "../../../../../lib/nba/topScorer";
import { batchPredictWinnerFromScores } from "../../../../../lib/predict/batchPredict";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import { toNativeGamesLanguage } from "./gamesI18n";
import { MATCH_CARD_DISPLAY_FONT } from "./matchCardTypography";
import NbaTopScorerPickerNative from "./predict/NbaTopScorerPickerNative";

const WIN_SCORE = "#F5C518";
const UNCONFIRMED = "rgba(255,255,255,0.38)";

export type BatchDayEntryRow = {
  gameId: string;
  homeLabel: string;
  awayLabel: string;
  league: string;
  knockout: boolean;
  homeTeamId: string;
  awayTeamId: string;
  homePpg?: number;
  awayPpg?: number;
  overrideCandidates?: unknown;
};

type Props = {
  rows: BatchDayEntryRow[];
  scores: Readonly<Record<string, { home: string; away: string } | undefined>>;
  onScore: (gameId: string, side: "home" | "away", value: string) => void;
  scorers: Readonly<Record<string, NbaTopScorerPick | null | undefined>>;
  onScorer: (gameId: string, pick: NbaTopScorerPick | null) => void;
  tieLabel: string;
  /** その試合の予想シート（INFORMATION の STATS）を開く */
  onOpenStats?: (gameId: string) => void;
};

export default function BatchDayEntryNative({
  rows,
  scores,
  onScore,
  scorers,
  onScorer,
  tieLabel,
  onOpenStats,
}: Props) {
  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <View key={row.gameId}>
          {index > 0 ? <View style={styles.gameRule} /> : null}
          <BatchDayBlock
            row={row}
            home={scores[row.gameId]?.home ?? ""}
            away={scores[row.gameId]?.away ?? ""}
            pick={scorers[row.gameId] ?? null}
            onScore={onScore}
            onScorer={onScorer}
            tieLabel={tieLabel}
            onOpenStats={onOpenStats}
          />
        </View>
      ))}
    </View>
  );
}

function digits(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 3);
}

function BatchDayBlock({
  row,
  home,
  away,
  pick,
  onScore,
  onScorer,
  tieLabel,
  onOpenStats,
}: {
  row: BatchDayEntryRow;
  home: string;
  away: string;
  pick: NbaTopScorerPick | null;
  onScore: (gameId: string, side: "home" | "away", value: string) => void;
  onScorer: (gameId: string, pick: NbaTopScorerPick | null) => void;
  tieLabel: string;
  onOpenStats?: (gameId: string) => void;
}) {
  const confirmed = home.trim() !== "" && away.trim() !== "";
  const homeNum = Number(home);
  const awayNum = Number(away);
  const tie =
    confirmed &&
    Number.isInteger(homeNum) &&
    Number.isInteger(awayNum) &&
    !batchPredictWinnerFromScores(row.league, homeNum, awayNum, row.knockout).ok;
  const nba = row.league.toLowerCase() === "nba" && !!row.homeTeamId && !!row.awayTeamId;

  function commit(side: "home" | "away", raw: string) {
    const next = digits(raw);
    onScore(row.gameId, side, next);
    if (!next) return;
    const otherSide = side === "home" ? "away" : "home";
    const other = side === "home" ? away : home;
    const otherPpg = side === "home" ? row.awayPpg : row.homePpg;
    if (other.trim() === "" && otherPpg != null) {
      onScore(row.gameId, otherSide, String(otherPpg));
    }
  }

  return (
    <View style={styles.block}>
      <View style={styles.scoreLine}>
        <View style={[styles.teamCol, styles.teamColHome]}>
          <View style={styles.teamStack}>
            <Text style={styles.sideTag}>HOME</Text>
            <Text style={styles.team} numberOfLines={1}>
              {row.homeLabel}
            </Text>
          </View>
        </View>
        <View style={styles.scoreCluster}>
          <ScoreField
            value={home}
            placeholder={row.homePpg}
            confirmed={confirmed}
            leading={confirmed && homeNum > awayNum}
            label={`${row.homeLabel} score`}
            onChange={(value) => commit("home", value)}
          />
          <Text style={styles.dash}>-</Text>
          <ScoreField
            value={away}
            placeholder={row.awayPpg}
            confirmed={confirmed}
            leading={confirmed && awayNum > homeNum}
            label={`${row.awayLabel} score`}
            onChange={(value) => commit("away", value)}
          />
        </View>
        <View style={[styles.teamCol, styles.teamColAway]}>
          <View style={styles.teamStack}>
            <Text style={styles.sideTag}>AWAY</Text>
            <Text style={styles.team} numberOfLines={1}>
              {row.awayLabel}
            </Text>
          </View>
        </View>
      </View>
      {nba && onOpenStats ? (
        <Pressable
          onPress={() => onOpenStats(row.gameId)}
          hitSlop={8}
          style={styles.statsButton}
          accessibilityRole="button"
          accessibilityLabel="STATS"
        >
          <MaterialCommunityIcons name="chevron-left" size={14} color="#00F5FF" />
          <Text style={styles.statsLabel}>STATS</Text>
        </Pressable>
      ) : null}
      {nba ? (
        <ScorerPick
          homeTeamId={row.homeTeamId}
          awayTeamId={row.awayTeamId}
          overrideCandidates={row.overrideCandidates}
          pick={pick}
          onPick={(next) => onScorer(row.gameId, next)}
        />
      ) : null}
      {tie ? (
        <Text style={styles.tie} accessibilityLiveRegion="polite">
          {tieLabel}
        </Text>
      ) : null}
    </View>
  );
}

function ScoreField({
  value,
  placeholder,
  confirmed,
  leading,
  label,
  onChange,
}: {
  value: string;
  placeholder?: number;
  confirmed: boolean;
  leading: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder != null ? String(placeholder) : ""}
      placeholderTextColor={UNCONFIRMED}
      keyboardType="number-pad"
      maxLength={3}
      accessibilityLabel={label}
      selectTextOnFocus
      style={[
        styles.input,
        { color: !confirmed ? "#ffffff" : leading ? WIN_SCORE : "#ffffff" },
      ]}
    />
  );
}

function ScorerPick({
  homeTeamId,
  awayTeamId,
  overrideCandidates,
  pick,
  onPick,
}: {
  homeTeamId: string;
  awayTeamId: string;
  overrideCandidates?: unknown;
  pick: NbaTopScorerPick | null;
  onPick: (pick: NbaTopScorerPick | null) => void;
}) {
  const { language } = useNativeLanguage();
  const override = useMemo(
    () => normalizeNbaTopScorerCandidates(overrideCandidates),
    [overrideCandidates]
  );
  return (
    <View style={styles.scorerRow}>
      <NbaTopScorerPickerNative
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        candidates={override.length > 0 ? override : undefined}
        value={pick}
        onChange={onPick}
        language={toNativeGamesLanguage(language)}
        compact
        collapsedCount={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  gameRule: {
    height: 1,
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  block: {
    gap: 6,
  },
  scoreLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  teamCol: {
    flex: 1,
    minWidth: 0,
  },
  teamColHome: {
    alignItems: "flex-end",
    paddingRight: 10,
  },
  teamColAway: {
    alignItems: "flex-start",
    paddingLeft: 10,
  },
  teamStack: {
    alignItems: "center",
    maxWidth: "100%",
    gap: 1,
  },
  sideTag: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 11,
    lineHeight: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  team: {
    color: "#F8FAFC",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  scoreCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 1,
  },
  input: {
    width: 52,
    height: 36,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Oxanium_600SemiBold",
    paddingVertical: 0,
  },
  dash: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },
  statsButton: {
    alignSelf: "flex-start",
    marginTop: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  statsLabel: {
    color: "#00F5FF",
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: "Oxanium_600SemiBold",
  },
  scorerRow: {
    marginTop: 0,
  },
  tie: {
    color: "#F87171",
    fontSize: 11,
    letterSpacing: 0.6,
    textAlign: "center",
  },
});
