import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { WcGoalScorerPick } from "../../../../../../lib/wc/goalScorer";
import {
  isWcGoalScorerPickValidForPredictedScore,
  wcGoalScorerEligibleTeamIds,
} from "../../../../../../lib/wc/goalScorer";
import { getWcSquad } from "../../../../../../lib/wc/squads";
import { findSquadPlayer, type WcSquadPlayer } from "../../../../../../lib/wc/squadTypes";
import CountryFlagNative from "../CountryFlagNative";
import type { GamesLanguage, GamesTexts } from "../gamesI18n";

type Props = {
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeLabel: string;
  awayLabel: string;
  predictedScore: { home: number; away: number } | null;
  value: WcGoalScorerPick | null;
  onChange: (next: WcGoalScorerPick | null) => void;
  language: GamesLanguage;
  t: GamesTexts;
};

function TeamPlayerColumn({
  teamId,
  label,
  squad,
  value,
  onPick,
}: {
  teamId: string;
  label: string;
  squad: WcSquadPlayer[];
  value: WcGoalScorerPick | null;
  onPick: (playerId: string, teamId: string) => void;
}) {
  return (
    <View style={styles.teamCol}>
      <View style={styles.teamColHeader}>
        <CountryFlagNative teamId={teamId} variant="inline" />
        <Text style={styles.teamColLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <ScrollView
        style={styles.playerScroll}
        contentContainerStyle={styles.playerScrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {squad.length === 0 ? (
          <Text style={styles.emptyPlayer}>—</Text>
        ) : (
          squad.map((player) => {
            const selected =
              value?.playerId === player.id && value.teamId === teamId;
            return (
              <Pressable
                key={player.id}
                onPress={() => onPick(player.id, teamId)}
                style={[styles.playerBtn, selected && styles.playerBtnSelected]}
              >
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={styles.playerPos}>{player.pos}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

/** Web `WcGoalScorerPicker` 相当 */
export default function WcGoalScorerPickerNative({
  homeTeamId,
  awayTeamId,
  homeLabel,
  awayLabel,
  predictedScore,
  value,
  onChange,
  t,
}: Props) {
  const homeSquad = useMemo(
    () => (homeTeamId ? getWcSquad(homeTeamId) ?? [] : []),
    [homeTeamId]
  );
  const awaySquad = useMemo(
    () => (awayTeamId ? getWcSquad(awayTeamId) ?? [] : []),
    [awayTeamId]
  );

  const eligibleTeamIds = useMemo(() => {
    if (!predictedScore) return [];
    return wcGoalScorerEligibleTeamIds(predictedScore, homeTeamId, awayTeamId);
  }, [predictedScore, homeTeamId, awayTeamId]);

  const teams = useMemo(
    () =>
      [
        homeTeamId && eligibleTeamIds.includes(homeTeamId)
          ? { teamId: homeTeamId, label: homeLabel, squad: homeSquad }
          : null,
        awayTeamId && eligibleTeamIds.includes(awayTeamId)
          ? { teamId: awayTeamId, label: awayLabel, squad: awaySquad }
          : null,
      ].filter(Boolean) as Array<{
        teamId: string;
        label: string;
        squad: WcSquadPlayer[];
      }>,
    [homeTeamId, awayTeamId, homeLabel, awayLabel, homeSquad, awaySquad, eligibleTeamIds]
  );

  useEffect(() => {
    if (!value) return;
    if (
      !isWcGoalScorerPickValidForPredictedScore(
        value,
        predictedScore,
        homeTeamId,
        awayTeamId
      )
    ) {
      onChange(null);
    }
  }, [value, predictedScore, homeTeamId, awayTeamId, onChange]);

  const selectedName = useMemo(() => {
    if (!value) return null;
    const squad =
      value.teamId === homeTeamId
        ? homeSquad
        : value.teamId === awayTeamId
          ? awaySquad
          : [];
    return findSquadPlayer(squad, value.playerId)?.name ?? null;
  }, [value, homeTeamId, awayTeamId, homeSquad, awaySquad]);

  const selectedTeamLabel =
    value?.teamId === homeTeamId
      ? homeLabel
      : value?.teamId === awayTeamId
        ? awayLabel
        : null;

  const unavailableHint = !predictedScore
    ? t.wcGoalScorerNeedsScore
    : eligibleTeamIds.length === 0
      ? t.wcGoalScorerZeroZero
      : null;

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t.wcGoalScorerTitle}</Text>
        <Text style={styles.bonusHint}>{t.wcGoalScorerBonusHint}</Text>
      </View>

      {value && selectedName ? (
        <View style={styles.selectedBox}>
          <View style={styles.selectedMain}>
            {value.teamId ? (
              <CountryFlagNative teamId={value.teamId} variant="inline" />
            ) : null}
            <View style={styles.selectedTextCol}>
              <Text style={styles.selectedName} numberOfLines={1}>
                {selectedName}
              </Text>
              {selectedTeamLabel ? (
                <Text style={styles.selectedTeam} numberOfLines={1}>
                  {selectedTeamLabel}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Text style={styles.clearBtn}>{t.wcGoalScorerClear}</Text>
          </Pressable>
        </View>
      ) : unavailableHint ? (
        <Text style={styles.hint}>{unavailableHint}</Text>
      ) : (
        <Text style={styles.hint}>{t.wcGoalScorerPlaceholder}</Text>
      )}

      {teams.length > 0 ? (
        <View style={[styles.teamGrid, teams.length === 1 && styles.teamGridSingle]}>
          {teams.map((team) => (
            <TeamPlayerColumn
              key={team.teamId}
              teamId={team.teamId}
              label={team.label}
              squad={team.squad}
              value={value}
              onPick={(playerId, teamId) => onChange({ playerId, teamId })}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, marginTop: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "600",
  },
  bonusHint: {
    color: "rgba(165,243,252,0.72)",
    fontSize: 12,
    fontWeight: "600",
  },
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 15,
  },
  selectedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
    borderRadius: 12,
    backgroundColor: "rgba(8,47,73,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  selectedTextCol: { flex: 1, minWidth: 0 },
  selectedName: {
    color: "#ecfeff",
    fontSize: 14,
    fontWeight: "700",
  },
  selectedTeam: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 1,
  },
  clearBtn: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    textDecorationLine: "underline",
  },
  teamGrid: {
    flexDirection: "row",
    gap: 8,
  },
  teamGridSingle: {
    flexDirection: "column",
  },
  teamCol: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  teamColHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  teamColLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "600",
  },
  playerScroll: { maxHeight: 176 },
  playerScrollContent: { padding: 4, gap: 2 },
  emptyPlayer: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 12,
  },
  playerBtn: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  playerBtnSelected: {
    backgroundColor: "rgba(6,182,212,0.22)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  playerName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
  },
  playerPos: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    marginTop: 1,
  },
});
