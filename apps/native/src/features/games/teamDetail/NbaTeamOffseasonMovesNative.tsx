/** Web `OffseasonMovesSection`（NbaTeamDetailPanel）相当 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getTeamUiAccentColor } from "../../../../../../lib/team-colors";
import { formatSalaryUsd } from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import { playerCardName } from "../../../../../../lib/predict/nbaRoster";
import {
  nbaOffseasonMovesUiCopy,
  offseasonMoveIsLinkable,
  offseasonMoveTag,
  OFFSEASON_MOVES_COLLAPSED_ROWS,
  type NbaOffseasonMovesUiCopy,
} from "../../../../../../lib/nba/offseasonMoves/offseasonMovesUiCopy";
import type {
  NbaOffseasonMove,
  NbaTeamOffseasonMoves,
} from "../../../../../../lib/nba/offseasonMoves/offseasonMovesTypes";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const FORM_WIN = "#00F5FF";
const FORM_LOSS = "#FF2D78";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function MoveRow({
  move,
  side,
  copy,
  onSelectPlayer,
}: {
  move: NbaOffseasonMove;
  side: "in" | "out";
  copy: NbaOffseasonMovesUiCopy;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const tag = offseasonMoveTag(move, copy);
  const linkable = !!onSelectPlayer && offseasonMoveIsLinkable(move, side);
  const body = (
    <>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {playerCardName({
            firstName: move.firstName,
            lastName: move.lastName,
            id: move.playerId,
          })}
        </Text>
        {move.isTwoWay ? <Text style={styles.twoWay}>{copy.twoWay}</Text> : null}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.tag} numberOfLines={1}>
          {tag.label ?? ""}
          {tag.label && tag.arrow ? " " : ""}
          {tag.arrow && tag.otherTeamShort ? (
            <Text>
              {tag.arrow}{" "}
              <Text
                style={[
                  styles.teamShort,
                  { color: getTeamUiAccentColor("nba", tag.otherTeamId) },
                ]}
              >
                {tag.otherTeamShort}
              </Text>
            </Text>
          ) : null}
        </Text>
        {move.salary ? (
          <Text style={styles.salary}>{formatSalaryUsd(move.salary)}</Text>
        ) : null}
      </View>
    </>
  );
  if (!linkable) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      onPress={() => onSelectPlayer?.(move.playerId)}
    >
      {body}
    </Pressable>
  );
}

function MovesColumn({
  side,
  moves,
  expanded,
  copy,
  accent,
  onSelectPlayer,
}: {
  side: "in" | "out";
  moves: NbaOffseasonMove[];
  expanded: boolean;
  copy: NbaOffseasonMovesUiCopy;
  accent: string;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const headColor = side === "in" ? FORM_WIN : FORM_LOSS;
  const rows = expanded
    ? moves
    : moves.slice(0, OFFSEASON_MOVES_COLLAPSED_ROWS);
  return (
    <View style={[styles.column, { borderColor: hexToRgba(accent, 0.3) }]}>
      <View
        style={[
          styles.columnHead,
          { borderBottomColor: hexToRgba(headColor, 0.35) },
        ]}
      >
        <Text style={[styles.columnTitle, { color: headColor }]}>
          {side === "in" ? copy.incoming : copy.outgoing}
        </Text>
        <Text style={styles.columnCount}>{moves.length}</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{copy.empty}</Text>
      ) : (
        rows.map((move, i) => (
          <View
            key={`${move.playerId}-${move.kind}`}
            style={i > 0 ? styles.rowDivider : null}
          >
            <MoveRow
              move={move}
              side={side}
              copy={copy}
              onSelectPlayer={onSelectPlayer}
            />
          </View>
        ))
      )}
    </View>
  );
}

export function NbaTeamOffseasonMovesNative({
  moves,
  accent,
  language,
  onSelectPlayer,
}: {
  moves: NbaTeamOffseasonMoves;
  accent: string;
  language: string | null | undefined;
  onSelectPlayer?: (playerId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const copy = nbaOffseasonMovesUiCopy(language);
  const longest = Math.max(moves.incoming.length, moves.outgoing.length);
  const collapsible = longest > OFFSEASON_MOVES_COLLAPSED_ROWS;
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{copy.sectionTitle}</Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
      </View>
      <View style={styles.columns}>
        <MovesColumn
          side="in"
          moves={moves.incoming}
          expanded={expanded}
          copy={copy}
          accent={accent}
          onSelectPlayer={onSelectPlayer}
        />
        <MovesColumn
          side="out"
          moves={moves.outgoing}
          expanded={expanded}
          copy={copy}
          accent={accent}
          onSelectPlayer={onSelectPlayer}
        />
      </View>
      {collapsible ? (
        <Pressable
          style={[styles.toggle, { borderColor: hexToRgba(accent, 0.3) }]}
          onPress={() => setExpanded((v) => !v)}
        >
          <Text style={styles.toggleText}>
            {expanded ? copy.showLess : copy.showAll(longest)}
          </Text>
        </Pressable>
      ) : null}
      {moves.priorSeasonKey ? (
        <Text style={styles.footnote}>{copy.footnote(moves.priorSeasonKey)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  titleLine: { flex: 1, height: 1 },
  columns: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  column: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  columnHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  columnTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.9,
    transform: [{ skewX: "-8deg" }],
  },
  columnCount: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
  },
  row: { paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  rowPressed: { backgroundColor: "rgba(255,255,255,0.05)" },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: {
    fontFamily: METRIC_FONT,
    flexShrink: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "700",
    transform: [{ skewX: "-8deg" }],
  },
  teamShort: { fontSize: 11 },
  twoWay: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  tag: {
    fontFamily: METRIC_FONT,
    flexShrink: 1,
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  salary: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggle: { borderWidth: 1, paddingVertical: 6, alignItems: "center" },
  toggleText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  footnote: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 13,
  },
});
