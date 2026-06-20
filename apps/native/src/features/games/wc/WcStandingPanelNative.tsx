import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SkeletonScanNative } from "../../../components/SkeletonScanNative";
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

function formatGoalDiff(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

function SectionTitleNative({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/** Web `WcStandingPanel` 相当（モバイル） */
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
      <View style={styles.section}>
        <SectionTitleNative>
          {group ? `${t.wcGroup} ${group.code}` : t.groupStandings}
        </SectionTitleNative>
        {!group ? (
          <Text style={styles.note}>{t.standingsNotAvailable}</Text>
        ) : loading || rows == null ? (
          <View style={styles.skeletonShell}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonScanNative key={i} style={styles.skeletonRow} />
            ))}
          </View>
        ) : error ? (
          <Text style={styles.note}>{t.standingsLoadFailed}</Text>
        ) : (
          <View style={styles.tableShell}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thRank]}>#</Text>
              <Text style={[styles.th, styles.thTeam]}>{t.teamLabel}</Text>
              <Text style={[styles.th, styles.thPlayed]}>P</Text>
              <Text style={styles.thNum}>W</Text>
              <Text style={styles.thNum}>D</Text>
              <Text style={styles.thNum}>L</Text>
              <Text style={styles.thNum}>GD</Text>
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
                    <Text
                      style={[
                        styles.teamName,
                        highlighted && styles.teamNameHighlight,
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </View>
                  <Text style={styles.tdPlayed}>{row.played}</Text>
                  <Text style={styles.tdNum}>{row.wins}</Text>
                  <Text style={styles.tdNum}>{row.draws}</Text>
                  <Text style={styles.tdNum}>{row.losses}</Text>
                  <Text
                    style={[
                      styles.tdNum,
                      row.goalDiff > 0
                        ? styles.tdGdPositive
                        : row.goalDiff < 0
                          ? styles.tdGdNegative
                          : styles.tdGdNeutral,
                    ]}
                  >
                    {formatGoalDiff(row.goalDiff)}
                  </Text>
                  <Text style={[styles.tdNum, styles.tdPts]}>{row.points}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionTitleNative>{t.fifaRanking}</SectionTitleNative>
        <View style={styles.fifaRow}>
          <FifaRankCardNative teamId={homeTeamId} language={language} />
          <FifaRankCardNative teamId={awayTeamId} language={language} />
        </View>
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
        <CountryFlagNative teamId={teamId} variant="fifaInline" />
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
        ) : diff === 0 ? (
          <Text style={styles.fifaDiffNeutral}>—</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  section: {
    gap: 0,
  },
  sectionTitle: {
    marginBottom: 6,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.98,
    textTransform: "uppercase",
  },
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
  skeletonShell: {
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
    padding: 8,
  },
  skeletonRow: {
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
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
    paddingHorizontal: 6,
  },
  th: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  thRank: { width: 28, textAlign: "left" },
  thTeam: { flex: 1, minWidth: 0, textAlign: "left" },
  thNum: { width: 24, textAlign: "center" },
  thPlayed: { width: 28, textAlign: "center" },
  thPts: {
    width: 34,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "800",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRowHighlight: {
    backgroundColor: "rgba(34,211,238,0.08)",
  },
  td: { minWidth: 0 },
  tdRank: {
    width: 28,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "left",
    fontVariant: ["tabular-nums"],
  },
  tdTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
  },
  teamName: {
    flex: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },
  teamNameHighlight: {
    color: "#fff",
  },
  tdNum: {
    width: 24,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  tdPlayed: {
    width: 28,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  tdGdPositive: {
    color: "rgba(110,231,183,0.85)",
  },
  tdGdNegative: {
    color: "rgba(253,164,175,0.85)",
  },
  tdGdNeutral: {
    color: "rgba(255,255,255,0.65)",
  },
  tdPts: {
    width: 34,
    color: "#fff",
    fontWeight: "800",
  },
  fifaRow: {
    flexDirection: "row",
    gap: 8,
  },
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
    minWidth: 0,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  fifaRankRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 8,
  },
  fifaLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  fifaRank: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
  },
  fifaDiff: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: "700",
  },
  fifaDiffUp: { color: "#34d399" },
  fifaDiffDown: { color: "#fb7185" },
  fifaDiffNeutral: {
    marginLeft: "auto",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
});
