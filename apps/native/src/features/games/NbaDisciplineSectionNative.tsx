/** Web `NbaDisciplineSection` 相当 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NbaDisciplineDetailSlice } from "../../../../../lib/nba/discipline/disciplineTypes";
import type { NbaLeagueTeamStatRow } from "../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import {
  buildDisciplineCells,
  disciplineFineLines,
  disciplineHasPlayoffs,
  disciplineSectionCopy,
  NBA_DISCIPLINE_SECTION_TITLE,
  type NbaDisciplineCell,
} from "../../../../../lib/nba/discipline/disciplineDetailCells";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function CellRow({
  cells,
  accent,
}: {
  cells: NbaDisciplineCell[];
  accent: string;
}) {
  return (
    <View style={styles.cellRow}>
      {cells.map((c) => (
        <View
          key={c.key}
          style={[styles.cell, { borderColor: hexToRgba(accent, 0.3) }]}
        >
          <Text style={styles.cellLabel}>{c.label}</Text>
          <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>
            {c.display}
          </Text>
          {c.rank != null ? (
            <Text style={styles.cellRank}>#{c.rank}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function NbaDisciplineSectionNative({
  slice,
  accent,
  isJa,
  leagueRows,
  teamId,
  showPlayerNames = false,
  onPlayerPress,
}: {
  slice: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  leagueRows?: readonly NbaLeagueTeamStatRow[];
  teamId?: string;
  showPlayerNames?: boolean;
  onPlayerPress?: (playerId: string) => void;
}) {
  const copy = disciplineSectionCopy(isJa);
  const regular = buildDisciplineCells(slice.regular, { leagueRows, teamId });
  const playoffs = disciplineHasPlayoffs(slice)
    ? buildDisciplineCells(slice.playoffs)
    : null;
  const fines = disciplineFineLines(slice);

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{NBA_DISCIPLINE_SECTION_TITLE}</Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
      </View>

      {playoffs ? <Text style={styles.phase}>{copy.regular}</Text> : null}
      <CellRow cells={regular} accent={accent} />

      {playoffs ? (
        <>
          <Text style={styles.phase}>{copy.playoffs}</Text>
          <CellRow cells={playoffs} accent={accent} />
        </>
      ) : null}

      {fines.length > 0 ? (
        <View style={[styles.fines, { borderColor: hexToRgba(accent, 0.3) }]}>
          {fines.map((f, i) => (
            <View
              key={f.key}
              style={[
                styles.fineRow,
                i > 0
                  ? {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: hexToRgba(accent, 0.2),
                    }
                  : null,
              ]}
            >
              <Text style={styles.fineDate}>{f.date}</Text>
              <View style={styles.fineBody}>
                {showPlayerNames ? (
                  <Pressable
                    onPress={() => onPlayerPress?.(f.playerId)}
                    disabled={!onPlayerPress}
                  >
                    <Text style={styles.fineName}>{f.playerName}</Text>
                  </Pressable>
                ) : null}
                <Text style={styles.fineReason}>
                  {f.reason}
                  {f.playoffs ? ` (${copy.playoffs})` : ""}
                </Text>
              </View>
              <Text style={styles.fineAmount}>{f.amount}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.note}>{copy.note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
  },
  titleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  phase: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  cellRow: {
    flexDirection: "row",
    gap: 6,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    backgroundColor: "rgba(8,8,12,0.4)",
    gap: 2,
  },
  cellLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  cellValue: {
    fontFamily: METRIC_FONT,
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  cellRank: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    fontVariant: ["tabular-nums"],
  },
  fines: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.4)",
  },
  fineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fineDate: {
    width: 38,
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  fineBody: {
    flex: 1,
    minWidth: 0,
  },
  fineName: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fineReason: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  fineAmount: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  note: {
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.35)",
  },
});
