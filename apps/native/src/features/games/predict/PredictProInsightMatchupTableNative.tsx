/** Web `PredictProInsightMatchupTable` 相当 */
import { StyleSheet, Text, View } from "react-native";
import type {
  ProInsightMatchupStatSide,
  ProInsightMatchupStatTable,
} from "../../../../../../lib/predict/proInsightNarrativeTypes";
import { L, type LocalizedLang } from "../../../../../../lib/i18n/localize";
import {
  matchupRankText,
  matchupTableCaption,
} from "../../../../../../lib/predict/proInsightMatchupTableCopy";
import {
  OXANIUM_600,
  OXANIUM_800,
  JP_600,
} from "../../profile/reports/reportThemeNative";

type Props = {
  table: ProInsightMatchupStatTable;
  lang: LocalizedLang;
  awayNick: string;
  homeNick: string;
  awayColor: string;
  homeColor: string;
};

function Cell({
  side,
  edge,
  color,
  align,
  lang,
}: {
  side: ProInsightMatchupStatSide;
  edge: boolean;
  color: string;
  align: "start" | "end";
  lang: LocalizedLang;
}) {
  const textAlign = align === "start" ? "left" : "right";
  return (
    <View
      style={[
        styles.cell,
        { alignItems: align === "start" ? "flex-start" : "flex-end" },
      ]}
    >
      <Text
        style={[
          styles.rank,
          { color: edge ? color : "rgba(255,255,255,0.4)", textAlign },
        ]}
      >
        {matchupRankText(side.rank, lang)}
      </Text>
      <Text style={[styles.metric, { textAlign }]} numberOfLines={1}>
        {L(lang, side.metric)} {side.value}
      </Text>
    </View>
  );
}

export default function PredictProInsightMatchupTableNative({
  table,
  lang,
  awayNick,
  homeNick,
  awayColor,
  homeColor,
}: Props) {
  return (
    <View>
      <View style={styles.headRow}>
        <Text style={[styles.headTeam, { color: awayColor }]} numberOfLines={1}>
          {awayNick}
        </Text>
        <Text
          style={[styles.headTeam, styles.headTeamRight, { color: homeColor }]}
          numberOfLines={1}
        >
          {homeNick}
        </Text>
      </View>
      {table.rows.map((row) => (
        <View key={row.kind} style={styles.row}>
          <View style={styles.rowMain}>
            <Cell
              side={row.away}
              edge={row.edgeTeamId === row.away.teamId}
              color={awayColor}
              align="start"
              lang={lang}
            />
            <Text style={styles.label}>{L(lang, row.label)}</Text>
            <Cell
              side={row.home}
              edge={row.edgeTeamId === row.home.teamId}
              color={homeColor}
              align="end"
              lang={lang}
            />
          </View>
          {(row.notes ?? []).map((n, i) => (
            <Text key={i} style={styles.note}>
              · {L(lang, n)}
            </Text>
          ))}
        </View>
      ))}
      <Text style={styles.caption}>{matchupTableCaption(table, lang)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 4,
  },
  headTeam: {
    flexShrink: 1,
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headTeamRight: {
    textAlign: "right",
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingVertical: 8,
    gap: 4,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  rank: {
    fontFamily: OXANIUM_800,
    fontSize: 15,
    lineHeight: 18,
  },
  metric: {
    fontFamily: OXANIUM_600,
    fontSize: 11,
    lineHeight: 14,
    color: "rgba(255,255,255,0.5)",
  },
  label: {
    maxWidth: 120,
    fontFamily: JP_600,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  note: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(251,113,133,0.85)",
  },
  caption: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 6,
    fontFamily: JP_600,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
  },
});
