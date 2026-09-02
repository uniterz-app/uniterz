/** Web `NbaInjuryReportPanel` 相当（HOME/AWAY 2カラム・ステータス + EXP + 詳細展開） */
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  injuryDetailLabel,
  injuryStatusShortLabel,
  injuryStatusTone,
  playerCardName,
  sortInjuryEntries,
  type NbaInjuryEntry,
  type NbaInjuryReport,
  type NbaInjuryTeamReport,
} from "../../../../../../lib/predict/nbaInjuryReport";
import { injuryReasonFullNews } from "../../../../../../lib/nba/teamInjuries/injuryReasonDisplay";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import type { GamesLanguage } from "../gamesI18n";
import { MATCH_CARD_DISPLAY_FONT } from "../matchCardTypography";

type Props = {
  report: NbaInjuryReport;
  language: GamesLanguage;
  onPlayerPress?: (playerId: string) => void;
};

const TONE_COLORS = {
  out: { accent: "#FF2D78", border: "rgba(255,45,120,0.85)" },
  doubt: { accent: "#FF8A3D", border: "rgba(255,138,61,0.85)" },
  question: { accent: "#F5C518", border: "rgba(245,197,24,0.9)" },
  probable: { accent: "#00E5FF", border: "rgba(0,229,255,0.85)" },
  available: { accent: "#2DFF6E", border: "rgba(45,255,110,0.85)" },
  neutral: {
    accent: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.22)",
  },
} as const;

function InjuryCard({
  row,
  language,
  expanded,
  onToggleExpand,
  onPress,
}: {
  row: NbaInjuryEntry;
  language: GamesLanguage;
  expanded: boolean;
  onToggleExpand: () => void;
  onPress?: (playerId: string) => void;
}) {
  const tone = injuryStatusTone(row.status);
  const colors = TONE_COLORS[tone] ?? TONE_COLORS.neutral;
  const lang = language === "ja" ? "ja" : "en";
  const statusShort = injuryStatusShortLabel(row.status);
  const detail = injuryDetailLabel(row, lang);
  const fullNews = injuryReasonFullNews(row.description, lang);
  const expected = (row.returnDate ?? "—").toUpperCase();
  const playerName = playerCardName(row.player);

  const body = (
    <>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.playerName} numberOfLines={1}>
          {playerName}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: colors.accent,
              backgroundColor: "rgba(255,255,255,0.06)",
            },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: colors.accent }]}>
            {statusShort}
          </Text>
        </View>
      </View>

      {detail ? (
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}

      <Text style={[styles.exp, { color: colors.accent }]} numberOfLines={1}>
        ↳ {expected}
      </Text>

      {fullNews && language !== "ja" ? (
        <Pressable onPress={onToggleExpand} accessibilityRole="button">
          <Text style={styles.moreBtn}>
            {expanded ? "Hide detail" : "More detail"}
          </Text>
        </Pressable>
      ) : null}

      {expanded && fullNews && language !== "ja" ? (
        <View style={styles.newsBox}>
          <Text style={styles.newsText}>{fullNews}</Text>
        </View>
      ) : null}
    </>
  );

  const cardStyle = [
    styles.card,
    {
      borderColor: colors.border,
      backgroundColor: "rgba(8,10,14,0.92)",
    },
  ];

  if (!onPress) {
    return <View style={cardStyle}>{body}</View>;
  }

  return (
    <Pressable
      onPress={() => onPress(String(row.player.id))}
      accessibilityRole="button"
      accessibilityLabel={playerName}
      android_ripple={
        Platform.OS === "android"
          ? { color: "rgba(255,255,255,0.14)" }
          : undefined
      }
      style={({ pressed }) => [cardStyle, pressed ? styles.cardPressed : null]}
    >
      {body}
    </Pressable>
  );
}

function columnTeamLabel(team: NbaInjuryTeamReport): string {
  const full = NBA_TEAM_NAME_BY_ID[team.teamId];
  if (full) return getMobileTeamName("nba", full).toUpperCase();
  return team.teamName.toUpperCase();
}

function TeamColumn({
  team,
  language,
  onPlayerPress,
  expandedId,
  onToggleExpand,
}: {
  team: NbaInjuryTeamReport;
  language: GamesLanguage;
  onPlayerPress?: (playerId: string) => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  const rows = sortInjuryEntries(team.entries);
  const countLabel = language === "ja" ? `${rows.length}名` : `${rows.length}`;

  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <Text style={styles.columnTitle} numberOfLines={1}>
          {columnTeamLabel(team)}
        </Text>
        <Text style={styles.columnCount}>{countLabel}</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>
          {language === "ja" ? "怪我人なし" : "No injuries"}
        </Text>
      ) : (
        rows.map((row) => {
          const rowKey = `${team.side}-${row.player.id}-${row.status}`;
          return (
            <InjuryCard
              key={`${rowKey}-${row.returnDate ?? ""}`}
              row={row}
              language={language}
              expanded={expandedId === rowKey}
              onToggleExpand={() => onToggleExpand(rowKey)}
              onPress={onPlayerPress}
            />
          );
        })
      )}
    </View>
  );
}

export default function NbaInjuryReportPanelNative({
  report,
  language,
  onPlayerPress,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View>
      <View style={styles.grid}>
        <TeamColumn
          team={report.home}
          language={language}
          onPlayerPress={onPlayerPress}
          expandedId={expandedId}
          onToggleExpand={(id) =>
            setExpandedId((cur) => (cur === id ? null : id))
          }
        />
        <TeamColumn
          team={report.away}
          language={language}
          onPlayerPress={onPlayerPress}
          expandedId={expandedId}
          onToggleExpand={(id) =>
            setExpandedId((cur) => (cur === id ? null : id))
          }
        />
      </View>
      {report.asOfLabel ? (
        <Text style={styles.asOf}>
          {language === "ja" ? "更新" : "Updated"} · {report.asOfLabel}
        </Text>
      ) : null}
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 8 },
  column: { flex: 1, minWidth: 0, gap: 6 },
  columnHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
    paddingHorizontal: 2,
  },
  columnTitle: {
    flex: 1,
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 1.2,
    lineHeight: 18,
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  columnCount: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  empty: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(8,10,14,0.92)",
    paddingVertical: 14,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  playerName: {
    fontFamily: OXANIUM,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: "#fff",
    textTransform: "uppercase",
    flex: 1,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  detail: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  exp: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  moreBtn: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  newsBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 2,
    padding: 8,
  },
  newsText: {
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(255,255,255,0.6)",
  },
  asOf: {
    marginTop: 8,
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    textTransform: "uppercase",
  },
});
