import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
  computeGroupStandings,
  type WcStandingRow,
} from "../../../../../../lib/wc/computeGroupStandings";
import { getWcGroupForTeam } from "../../../../../../lib/wc/groups";
import { getWcTeamProfile } from "../../../../../../lib/wc/teams";
import { teamIdToCountryName } from "../../../../../../lib/wc/wcCountry";
import CountryFlagNative from "../CountryFlagNative";
import type { GamesLanguage, GamesTexts } from "../gamesI18n";
import { useWcSeasonGamesNative } from "./useWcSeasonGamesNative";

const DEFAULT_SEASON = "2025-26";

type Props = {
  homeTeamId: string;
  awayTeamId: string;
  season?: string | null;
  language: GamesLanguage;
  t: GamesTexts;
};

/** Web `WcStandingPanel` 相当（モバイル簡略版） */
export default function WcStandingPanelNative({
  homeTeamId,
  awayTeamId,
  season,
  language,
  t,
}: Props) {
  const effectiveSeason = season ?? DEFAULT_SEASON;
  const group = useMemo(
    () => getWcGroupForTeam(homeTeamId) ?? getWcGroupForTeam(awayTeamId) ?? null,
    [homeTeamId, awayTeamId]
  );
  const { games, loading, error } = useWcSeasonGamesNative(effectiveSeason);
  const rows: WcStandingRow[] | null = useMemo(() => {
    if (!group || games == null) return null;
    return computeGroupStandings(group.teamIds, games);
  }, [group, games]);
  const highlightSet = useMemo(
    () => new Set([homeTeamId, awayTeamId]),
    [homeTeamId, awayTeamId]
  );
  const locale = language === "ja" ? "ja" : "en";

  return (
    <View style={styles.root}>
      <Text style={styles.sectionTitle}>
        {group ? `${t.wcGroup} ${group.code}` : t.groupStandings}
      </Text>
      {!group ? (
        <Text style={styles.note}>{t.standingsNotAvailable}</Text>
      ) : loading || rows == null ? (
        <ActivityIndicator color="#22d3ee" style={styles.loader} />
      ) : error ? (
        <Text style={styles.note}>{t.standingsLoadFailed}</Text>
      ) : (
        <View style={styles.tableShell}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thRank]}>#</Text>
            <Text style={[styles.th, styles.thTeam]}>{t.teamLabel}</Text>
            <Text style={styles.thNum}>P</Text>
            <Text style={styles.thNum}>W</Text>
            <Text style={styles.thNum}>D</Text>
            <Text style={styles.thNum}>L</Text>
            <Text style={[styles.thNum, styles.thPts]}>{t.wcPoints}</Text>
          </View>
          {rows.map((row, idx) => {
            const highlighted = highlightSet.has(row.teamId);
            const name =
              teamIdToCountryName(row.teamId, locale === "ja" ? "ja" : "en") ??
              row.teamId;
            return (
              <View
                key={row.teamId}
                style={[styles.tableRow, highlighted && styles.tableRowHighlight]}
              >
                <Text style={[styles.td, styles.tdRank]}>{idx + 1}</Text>
                <View style={[styles.td, styles.tdTeam]}>
                  <CountryFlagNative teamId={row.teamId} variant="inline" />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
                <Text style={styles.tdNum}>{row.played}</Text>
                <Text style={styles.tdNum}>{row.wins}</Text>
                <Text style={styles.tdNum}>{row.draws}</Text>
                <Text style={styles.tdNum}>{row.losses}</Text>
                <Text style={[styles.tdNum, styles.tdPts]}>{row.points}</Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>{t.fifaRanking}</Text>
      <View style={styles.fifaRow}>
        <FifaRankCardNative teamId={homeTeamId} language={language} />
        <FifaRankCardNative teamId={awayTeamId} language={language} />
      </View>
    </View>
  );
}

function FifaRankCardNative({
  teamId,
  language,
}: {
  teamId: string;
  language: GamesLanguage;
}) {
  const profile = getWcTeamProfile(teamId);
  const name =
    teamIdToCountryName(teamId, language === "ja" ? "ja" : "en") ?? teamId;
  const diff =
    profile?.fifaRank != null && profile?.fifaRankPrev != null
      ? profile.fifaRankPrev - profile.fifaRank
      : null;

  return (
    <View style={styles.fifaCard}>
      <View style={styles.fifaHeader}>
        <CountryFlagNative teamId={teamId} variant="inline" />
        <Text style={styles.fifaName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.fifaRankRow}>
        <Text style={styles.fifaLabel}>FIFA</Text>
        <Text style={styles.fifaRank}>
          {profile?.fifaRank != null ? `#${profile.fifaRank}` : "—"}
        </Text>
        {diff != null && diff !== 0 ? (
          <Text
            style={[
              styles.fifaDiff,
              diff > 0 ? styles.fifaDiffUp : styles.fifaDiffDown,
            ]}
          >
            {diff > 0 ? "▲" : "▼"}
            {Math.abs(diff)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  sectionTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  sectionTitleSpaced: { marginTop: 8 },
  note: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  loader: { paddingVertical: 16 },
  tableShell: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  th: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  thRank: { width: 22, textAlign: "left" },
  thTeam: { flex: 1, textAlign: "left" },
  thNum: { width: 22, textAlign: "center" },
  thPts: { color: "rgba(255,255,255,0.9)" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowHighlight: {
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  td: { minWidth: 0 },
  tdRank: {
    width: 22,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    textAlign: "left",
  },
  tdTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  teamName: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "600",
  },
  tdNum: {
    width: 22,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  tdPts: {
    color: "#fff",
    fontWeight: "800",
  },
  fifaRow: { flexDirection: "row", gap: 8 },
  fifaCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: 10,
  },
  fifaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fifaName: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  fifaRankRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 8,
  },
  fifaLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  fifaRank: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  fifaDiff: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: "700",
  },
  fifaDiffUp: { color: "#34d399" },
  fifaDiffDown: { color: "#fb7185" },
});
