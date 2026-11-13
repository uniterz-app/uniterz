/** その日の未入力を1画面に積む。スコアは触った試合だけ確定し、NBA は最多得点も同じ塊で選ぶ */
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  nbaTopScorerSegmentLabel,
  normalizeNbaTopScorerCandidates,
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "../../../../../lib/nba/topScorer";
import { useNbaTopScorerCandidates } from "../../../../../lib/nba/useNbaTopScorerCandidates";
import { getTeamRosterMarkColor } from "../../../../../lib/team-colors";
import { batchPredictWinnerFromScores } from "../../../../../lib/predict/batchPredict";
import {
  injuryStatusByPlayerId,
  injuryStatusTone,
} from "../../../../../lib/predict/nbaInjuryReport";
import { useNbaMatchupInjuryReport } from "../../../../../lib/nba/predict/useNbaMatchupInjuryReport";
import {
  CYBER_TAB_CYAN,
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

const TOP_BOTH_TEAMS = 4;
const WIN_SCORE = "#F5C518";
const UNCONFIRMED = "rgba(255,255,255,0.38)";
/** 予想シートの OUT チップと同じ */
const OUT_PINK = "#FF8AB4";
const OUT_HOT = "#FF2D78";

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
      {rows.map((row) => (
        <BatchDayBlock
          key={row.gameId}
          row={row}
          home={scores[row.gameId]?.home ?? ""}
          away={scores[row.gameId]?.away ?? ""}
          pick={scorers[row.gameId] ?? null}
          onScore={onScore}
          onScorer={onScorer}
          tieLabel={tieLabel}
          onOpenStats={onOpenStats}
        />
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
        <Text style={[styles.team, styles.teamHome]} numberOfLines={1}>
          {row.homeLabel}
        </Text>
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
        <Text style={[styles.team, styles.teamAway]} numberOfLines={1}>
          {row.awayLabel}
        </Text>
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
  const { report: injuryReport } = useNbaMatchupInjuryReport({
    homeTeamId,
    awayTeamId,
    apiBaseUrl: getUniterzApiBaseUrl(),
    enabled: true,
  });
  const injuryById = useMemo(
    () => (injuryReport ? injuryStatusByPlayerId(injuryReport) : {}),
    [injuryReport]
  );
  if (!loading && top.length === 0) return null;
  const slots: Array<NbaTopScorerCandidate | null> =
    top.length > 0 ? top : Array.from({ length: TOP_BOTH_TEAMS }, () => null);
  const outFlags = slots.map((player) =>
    player
      ? injuryStatusTone(injuryById[player.playerId] ?? "") === "out"
      : false
  );
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
          const out = outFlags[index];
          return (
            <CyberSlantedTabNative
              key={`${player.teamId}:${player.playerId}`}
              label={nbaTopScorerSegmentLabel(player.name)}
              active={selected}
              compact
              theme={{
                accent: out ? OUT_PINK : CYBER_TAB_CYAN,
                inactiveText: out ? OUT_PINK : CYBER_TAB_CYAN,
                inactiveBorder: out
                  ? OUT_HOT
                  : getTeamRosterMarkColor("nba", player.teamId),
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
      {outFlags.some(Boolean) ? (
        <View style={styles.outRow}>
          {outFlags.map((out, index) => (
            <View key={`out-${index}`} style={styles.outCell}>
              {out ? <Text style={styles.outLabel}>OUT</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
    gap: 14,
    paddingBottom: 8,
  },
  block: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.14)",
  },
  scoreLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  team: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "Oxanium_600SemiBold",
  },
  teamHome: {
    textAlign: "right",
    marginRight: 10,
  },
  teamAway: {
    textAlign: "left",
    marginLeft: 10,
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
    marginTop: 2,
  },
  outRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: -4,
  },
  outCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  outLabel: {
    color: OUT_HOT,
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: "Oxanium_700Bold",
  },
  tie: {
    color: "#F87171",
    fontSize: 11,
    letterSpacing: 0.6,
    textAlign: "center",
  },
});
