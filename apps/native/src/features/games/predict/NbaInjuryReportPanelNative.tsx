/** Web `NbaInjuryReportPanel` 相当（HOME/AWAY 2カラム・ステータスアイコン + EXP） */
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import {
  injuryDetailLabel,
  injuryStatusLabel,
  injuryStatusShortLabel,
  injuryStatusTone,
  playerCardName,
  sortInjuryEntries,
  type InjuryStatusTone,
  type NbaInjuryEntry,
  type NbaInjuryReport,
  type NbaInjuryTeamReport,
} from "../../../../../../lib/predict/nbaInjuryReport";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import type { GamesLanguage } from "../gamesI18n";
import { MATCH_CARD_DISPLAY_FONT } from "../matchCardTypography";

type Props = {
  report: NbaInjuryReport;
  language: GamesLanguage;
  onPlayerPress?: (playerId: string) => void;
};

const TONE_COLORS: Record<
  InjuryStatusTone,
  { accent: string; border: string }
> = {
  out: { accent: "#FF2D78", border: "rgba(255,45,120,0.85)" },
  doubt: { accent: "#FF8A3D", border: "rgba(255,138,61,0.85)" },
  question: { accent: "#F5C518", border: "rgba(245,197,24,0.9)" },
  probable: { accent: "#00E5FF", border: "rgba(0,229,255,0.85)" },
  available: { accent: "#2DFF6E", border: "rgba(45,255,110,0.85)" },
  neutral: {
    accent: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.22)",
  },
};

/** Web `StatusIcon` 相当（tone ごとのアイコン） */
function StatusIcon({ tone, color }: { tone: InjuryStatusTone; color: string }) {
  if (tone === "out") {
    return (
      <Svg width={22} height={22} viewBox="0 0 28 28" fill="none">
        <Path d="M7 7L21 21M21 7L7 21" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      </Svg>
    );
  }
  if (tone === "question" || tone === "doubt") {
    return (
      <Svg width={22} height={22} viewBox="0 0 28 28" fill="none">
        <Circle cx={14} cy={14} r={11} stroke={color} strokeWidth={2.2} />
        <Path
          d="M10.8 10.6c0-1.9 1.5-3.4 3.3-3.4s3.3 1.4 3.3 3.2c0 1.5-.8 2.3-2 3.1-.9.6-1.5 1.2-1.5 2.4"
          stroke={color}
          strokeWidth={2.1}
          strokeLinecap="round"
        />
        <Circle cx={14} cy={20.2} r={1.35} fill={color} />
      </Svg>
    );
  }
  if (tone === "probable") {
    return (
      <Svg width={22} height={22} viewBox="0 0 28 28" fill="none">
        <Path
          d="M14 3.5L23 7.2V13c0 5.4-3.7 9.4-9 10.8C8.7 22.4 5 18.4 5 13V7.2L14 3.5Z"
          stroke={color}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (tone === "available") {
    return (
      <Svg width={22} height={22} viewBox="0 0 28 28" fill="none">
        <Path
          d="M6.5 14.5L11.5 19.5L21.5 8.5"
          stroke={color}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={22} height={22} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={9} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function InjuryCard({
  row,
  language,
  onPress,
}: {
  row: NbaInjuryEntry;
  language: GamesLanguage;
  onPress?: (playerId: string) => void;
}) {
  const tone = injuryStatusTone(row.status);
  const colors = TONE_COLORS[tone] ?? TONE_COLORS.neutral;
  const statusShort = injuryStatusShortLabel(row.status);
  const detail = injuryDetailLabel(row, language === "ja" ? "ja" : "en");
  const expected = (row.returnDate ?? "—").toUpperCase();

  const body = (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: "rgba(8,10,14,0.92)",
        },
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.playerName} numberOfLines={1}>
          {playerCardName(row.player)}
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
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(String(row.player.id))}
        accessibilityRole="button"
        accessibilityLabel={playerCardName(row.player)}
        android_ripple={
          Platform.OS === "android"
            ? { color: "rgba(255,255,255,0.14)" }
            : undefined
        }
        style={({ pressed }) => [pressed ? styles.cardPressed : null]}
      >
        {body}
      </Pressable>
    );
  }

  return body;
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
}: {
  team: NbaInjuryTeamReport;
  language: GamesLanguage;
  onPlayerPress?: (playerId: string) => void;
}) {
  const rows = sortInjuryEntries(team.entries);
  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle} numberOfLines={1}>
        {columnTeamLabel(team)}
      </Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{language === "ja" ? "怪我人なし" : "No injuries"}</Text>
      ) : (
        rows.map((row) => (
          <InjuryCard
            key={`${row.player.id}-${row.status}-${row.returnDate ?? ""}`}
            row={row}
            language={language}
            onPress={onPlayerPress}
          />
        ))
      )}
    </View>
  );
}

export default function NbaInjuryReportPanelNative({
  report,
  language,
  onPlayerPress,
}: Props) {
  return (
    <View style={styles.grid}>
      <TeamColumn
        team={report.home}
        language={language}
        onPlayerPress={onPlayerPress}
      />
      <TeamColumn
        team={report.away}
        language={language}
        onPlayerPress={onPlayerPress}
      />
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 8 },
  column: { flex: 1, minWidth: 0, gap: 6 },
  columnTitle: {
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
});
