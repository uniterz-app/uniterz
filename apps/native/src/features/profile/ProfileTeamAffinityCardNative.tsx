/**
 * Web `TeamAffinityCard` のネイティブ版。
 */
import { StyleSheet, Text, View } from "react-native";
import type { TeamAffinityRow } from "./profileAnalysisUtils";
import { colors, radius } from "../../theme/tokens";
import { profileTeamAffinityCopy } from "./profileOverviewWidgetsCopy";

type Props = {
  strong: TeamAffinityRow[];
  weak: TeamAffinityRow[];
  language: string;
};

export default function ProfileTeamAffinityCardNative({ strong, weak, language }: Props) {
  const copy = profileTeamAffinityCopy(language);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy.title}</Text>
      <View style={styles.columns}>
        <TeamList
          title={copy.strong}
          tone="strong"
          data={strong}
          copy={copy}
        />
        <TeamList
          title={copy.weak}
          tone="weak"
          data={weak}
          copy={copy}
        />
      </View>
    </View>
  );
}

function TeamList({
  title,
  tone,
  data,
  copy,
}: {
  title: string;
  tone: "strong" | "weak";
  data: TeamAffinityRow[];
  copy: ReturnType<typeof profileTeamAffinityCopy>;
}) {
  const titleColor = tone === "strong" ? "#67e8f9" : "#e879f9";
  const barColor = tone === "strong" ? "#22d3ee" : "#e879f9";

  if (data.length === 0) {
    return (
      <View style={styles.listCol}>
        <Text style={[styles.listTitle, { color: titleColor }]}>{title}</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{copy.notEnough}</Text>
          <Text style={styles.emptyBody}>{copy.needFive}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.listCol}>
      <Text style={[styles.listTitle, { color: titleColor }]}>{title}</Text>
      {data.map((team, index) => {
        const rate = Math.round(clamp01(team.winRate) * 100);
        return (
          <View key={team.teamId} style={styles.teamRow}>
            <View style={styles.teamHead}>
              <View style={styles.teamNameRow}>
                <Text style={styles.rank}>{index + 1}</Text>
                <Text style={styles.teamName} numberOfLines={1}>
                  {team.teamName}
                </Text>
              </View>
              <View style={styles.teamMeta}>
                <Text style={styles.games}>{copy.games(team.games)}</Text>
                <Text style={[styles.rate, { color: titleColor }]}>{rate}%</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={styles.hint}>{copy.hint(rate)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(5,8,20,0.85)",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  columns: { gap: 14 },
  listCol: { gap: 8 },
  listTitle: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  emptyBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyTitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" },
  emptyBody: {
    marginTop: 4,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  teamRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  teamHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  teamNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  rank: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", width: 14 },
  teamName: { color: colors.textPrimary, fontSize: 13, fontWeight: "700", flex: 1 },
  teamMeta: { alignItems: "flex-end" },
  games: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  rate: { fontSize: 13, fontWeight: "800" },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: { height: 8, borderRadius: 999 },
  hint: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
});
