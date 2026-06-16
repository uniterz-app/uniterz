/**
 * Web `TeamAffinityCard` のネイティブ版。
 */
import { StyleSheet, Text, View } from "react-native";
import type { TeamAffinityRow } from "./profileAnalysisUtils";
import { colors, radius } from "../../theme/tokens";

type Props = {
  strong: TeamAffinityRow[];
  weak: TeamAffinityRow[];
  language: "ja" | "en";
};

export default function ProfileTeamAffinityCardNative({ strong, weak, language }: Props) {
  const isJa = language === "ja";
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {isJa ? "チーム別パフォーマンス" : "Team performance"}
      </Text>
      <View style={styles.columns}>
        <TeamList
          title={isJa ? "相性の良いチーム" : "Strong matchups"}
          tone="strong"
          data={strong}
          isJa={isJa}
        />
        <TeamList
          title={isJa ? "相性の悪いチーム" : "Weak matchups"}
          tone="weak"
          data={weak}
          isJa={isJa}
        />
      </View>
    </View>
  );
}

function TeamList({
  title,
  tone,
  data,
  isJa,
}: {
  title: string;
  tone: "strong" | "weak";
  data: TeamAffinityRow[];
  isJa: boolean;
}) {
  const titleColor = tone === "strong" ? "#67e8f9" : "#e879f9";
  const barColor = tone === "strong" ? "#22d3ee" : "#e879f9";

  if (data.length === 0) {
    return (
      <View style={styles.listCol}>
        <Text style={[styles.listTitle, { color: titleColor }]}>{title}</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{isJa ? "データ不足" : "Not enough data"}</Text>
          <Text style={styles.emptyBody}>
            {isJa ? "各チーム最低5投稿が必要です" : "At least 5 posts per team required"}
          </Text>
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
                <Text style={styles.games}>
                  {isJa ? `${team.games}試合` : `${team.games} games`}
                </Text>
                <Text style={[styles.rate, { color: titleColor }]}>{rate}%</Text>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={styles.hint}>{affinityHint(rate, isJa)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function affinityHint(rate: number, isJa: boolean): string {
  if (isJa) {
    if (rate >= 70) return "安定して勝てている";
    if (rate >= 55) return "やや相性が良い";
    if (rate >= 45) return "五分の相性";
    return "相性が悪い";
  }
  if (rate >= 70) return "Consistently strong";
  if (rate >= 55) return "Slightly favorable";
  if (rate >= 45) return "Even matchup";
  return "Unfavorable";
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
