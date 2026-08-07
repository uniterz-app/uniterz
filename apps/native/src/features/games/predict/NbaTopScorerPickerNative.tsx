/** Web `NbaTopScorerPicker` 相当 */
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  sortNbaTopScorerCandidatesByPpg,
  type NbaTopScorerCandidate,
  type NbaTopScorerPick,
} from "../../../../../../lib/nba/topScorer";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import type { GamesLanguage } from "../gamesI18n";
import { getGamesTexts } from "../gamesI18n";

type Props = {
  candidates: NbaTopScorerCandidate[];
  value: NbaTopScorerPick | null;
  onChange: (next: NbaTopScorerPick | null) => void;
  language: GamesLanguage;
};

function fmtPpg(ppg: number | null | undefined): string {
  if (ppg == null || !Number.isFinite(ppg)) return "—";
  return ppg.toFixed(1);
}

function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.slice(-3)).toUpperCase();
}

export default function NbaTopScorerPickerNative({
  candidates,
  value,
  onChange,
  language,
}: Props) {
  const t = getGamesTexts(language);
  const sorted = useMemo(
    () => sortNbaTopScorerCandidatesByPpg(candidates),
    [candidates]
  );

  const onPick = (row: NbaTopScorerCandidate) => {
    if (value?.playerId === row.playerId && value?.teamId === row.teamId) {
      onChange(null);
      return;
    }
    onChange({ playerId: row.playerId, teamId: row.teamId, name: row.name });
  };

  if (sorted.length === 0) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.nbaTopScorerTitle}</Text>
            <Text style={styles.hint}>{t.nbaTopScorerBonusHint}</Text>
          </View>
        </View>
        <Text style={styles.empty}>{t.nbaTopScorerEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t.nbaTopScorerTitle}</Text>
          <Text style={styles.hint}>{t.nbaTopScorerBonusHint}</Text>
        </View>
        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.nbaTopScorerClear}
          >
            <Text style={styles.clear}>{t.nbaTopScorerClear}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.list}>
        {sorted.map((c) => {
          const active =
            value?.playerId === c.playerId && value?.teamId === c.teamId;
          const accent = getTeamPrimaryColor("nba", c.teamId) ?? "#22d3ee";
          return (
            <Pressable
              key={`${c.teamId}:${c.playerId}`}
              onPress={() => onPick(c)}
              style={[
                styles.row,
                active && {
                  borderColor: accent,
                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={styles.rowMain}>
                <Text style={styles.abbr}>{teamAbbr(c.teamId)}</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {c.name}
                </Text>
              </View>
              <Text style={styles.ppg}>{fmtPpg(c.ppg)} PPG</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 2,
  },
  clear: {
    color: "rgba(34,211,238,0.85)",
    fontSize: 11,
    fontWeight: "600",
  },
  empty: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  list: {
    gap: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  abbr: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    width: 36,
  },
  name: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  ppg: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
  },
});
