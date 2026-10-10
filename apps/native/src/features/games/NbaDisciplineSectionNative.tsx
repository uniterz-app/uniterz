/** Web `NbaDisciplineSection` 相当 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  NbaDisciplineDetailSlice,
  NbaDisciplineSeasonType,
} from "../../../../../lib/nba/discipline/disciplineTypes";
import {
  buildDisciplineCells,
  disciplineFineLines,
  disciplineHasPlayoffs,
  disciplineHasRecords,
  disciplinePlayerRows,
  disciplineSectionCopy,
  NBA_DISCIPLINE_COLLAPSED_ROWS,
  NBA_DISCIPLINE_HOT_RANK,
  NBA_DISCIPLINE_SECTION_TITLE,
  type NbaDisciplineCell,
} from "../../../../../lib/nba/discipline/disciplineDetailCells";
import { useNbaTeamDisciplineSeason } from "../../../../../lib/nba/discipline/useNbaTeamDisciplineSeason";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";
import NbaLeagueStatsSeasonNavNative from "./NbaLeagueStatsSeasonNavNative";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

type Copy = ReturnType<typeof disciplineSectionCopy>;

function CellRow({
  cells,
  accent,
  leagueLabel,
}: {
  cells: NbaDisciplineCell[];
  accent: string;
  leagueLabel: string;
}) {
  return (
    <View style={styles.cellRow}>
      {cells.map((c) => {
        const hot = c.rank != null && c.rank <= NBA_DISCIPLINE_HOT_RANK;
        return (
          <View
            key={c.key}
            style={[
              styles.cell,
              { borderColor: hexToRgba(accent, hot ? 0.6 : 0.3) },
              hot ? { borderBottomWidth: 2, borderBottomColor: hexToRgba(accent, 0.8) } : null,
            ]}
          >
            <Text style={styles.cellLabel}>{c.label}</Text>
            <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>
              {c.display}
            </Text>
            <Text style={[styles.cellRank, hot ? { color: accent } : null]}>
              {c.rank != null ? `${leagueLabel} #${c.rank}` : " "}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function PhaseToggle({
  phase,
  onChange,
  accent,
  copy,
}: {
  phase: NbaDisciplineSeasonType;
  onChange: (p: NbaDisciplineSeasonType) => void;
  accent: string;
  copy: Copy;
}) {
  return (
    <View style={styles.phaseRow}>
      {(["regular", "playoffs"] as const).map((p) => {
        const on = p === phase;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            style={[styles.phaseBtn, { borderBottomColor: on ? accent : "transparent" }]}
          >
            <Text style={[styles.phaseText, on ? styles.phaseTextOn : null]}>
              {p === "regular" ? copy.regular : copy.playoffs}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ExpandButton({
  expanded,
  total,
  onToggle,
  accent,
  copy,
}: {
  expanded: boolean;
  total: number;
  onToggle: () => void;
  accent: string;
  copy: Copy;
}) {
  if (total <= NBA_DISCIPLINE_COLLAPSED_ROWS) return null;
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.expand, { borderTopColor: hexToRgba(accent, 0.2) }]}
    >
      <Text style={[styles.expandText, { color: accent }]}>
        {expanded ? copy.showLess : copy.showAll(total)}
      </Text>
    </Pressable>
  );
}

export function NbaDisciplineSectionNative({
  slice,
  accent,
  isJa,
  showPlayerNames = false,
  onPlayerPress,
  season,
}: {
  slice: NbaDisciplineDetailSlice | null;
  accent: string;
  isJa: boolean;
  showPlayerNames?: boolean;
  onPlayerPress?: (playerId: string) => void;
  season?: {
    seasonKey: string;
    seasonKeys: readonly string[];
    onChange: (seasonKey: string) => void;
    loading: boolean;
  };
}) {
  const copy = disciplineSectionCopy(isJa);
  const hasPlayoffs = slice ? disciplineHasPlayoffs(slice) : false;
  const [phase, setPhase] = useState<NbaDisciplineSeasonType>("regular");
  const [playersOpen, setPlayersOpen] = useState(false);
  const [finesOpen, setFinesOpen] = useState(false);

  useEffect(() => {
    setPhase("regular");
    setPlayersOpen(false);
    setFinesOpen(false);
  }, [slice?.season]);

  const activePhase: NbaDisciplineSeasonType = hasPlayoffs ? phase : "regular";
  const cells = slice
    ? buildDisciplineCells(slice[activePhase], slice.ranks?.[activePhase])
    : [];
  const playerRows = slice?.players ? disciplinePlayerRows(slice, activePhase) : [];
  const fines = slice ? disciplineFineLines(slice, activePhase) : [];
  const shownPlayers = playersOpen
    ? playerRows
    : playerRows.slice(0, NBA_DISCIPLINE_COLLAPSED_ROWS);
  const shownFines = finesOpen ? fines : fines.slice(0, NBA_DISCIPLINE_COLLAPSED_ROWS);
  const empty = slice != null && !disciplineHasRecords(slice, activePhase);
  const boxBorder = { borderColor: hexToRgba(accent, 0.3) };
  const rowBorder = {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: hexToRgba(accent, 0.2),
  };

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{NBA_DISCIPLINE_SECTION_TITLE}</Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
        {season ? (
          <NbaLeagueStatsSeasonNavNative
            seasonKey={season.seasonKey}
            seasonKeys={season.seasonKeys}
            onSeasonChange={season.onChange}
          />
        ) : null}
      </View>

      {!slice ? (
        <Text style={styles.empty}>{season?.loading ? copy.loading : copy.empty}</Text>
      ) : (
        <>
          {hasPlayoffs ? (
            <PhaseToggle
              phase={activePhase}
              onChange={setPhase}
              accent={accent}
              copy={copy}
            />
          ) : null}

          <CellRow cells={cells} accent={accent} leagueLabel={copy.league} />

          {empty ? <Text style={styles.empty}>{copy.empty}</Text> : null}

          {shownPlayers.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.subLabel}>{copy.players}</Text>
              <View style={[styles.box, boxBorder]}>
                <View style={styles.tableRow}>
                  <Text style={[styles.th, styles.colName]}>{copy.player}</Text>
                  <Text style={[styles.th, styles.colN]}>T</Text>
                  <Text style={[styles.th, styles.colN]}>F</Text>
                  <Text style={[styles.th, styles.colN]}>E</Text>
                  <Text style={[styles.th, styles.colSusp]}>SUSP</Text>
                  <Text style={[styles.th, styles.colFines]}>FINES</Text>
                </View>
                {shownPlayers.map((r) => (
                  <Pressable
                    key={r.playerId}
                    onPress={() => onPlayerPress?.(r.playerId)}
                    disabled={!onPlayerPress}
                    style={[styles.tableRow, rowBorder]}
                  >
                    <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={[styles.td, styles.colN]}>{r.tech}</Text>
                    <Text style={[styles.td, styles.colN]}>{r.flag}</Text>
                    <Text style={[styles.td, styles.colN]}>{r.eject}</Text>
                    <Text style={[styles.td, styles.colSusp]}>{r.susp}</Text>
                    <Text style={[styles.td, styles.colFines]}>{r.fines}</Text>
                  </Pressable>
                ))}
                <ExpandButton
                  expanded={playersOpen}
                  total={playerRows.length}
                  onToggle={() => setPlayersOpen((v) => !v)}
                  accent={accent}
                  copy={copy}
                />
              </View>
            </View>
          ) : null}

          {shownFines.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.subLabel}>
                {copy.fineLog} · {fines.length}
              </Text>
              <View style={[styles.box, boxBorder]}>
                {shownFines.map((f, i) => (
                  <View key={f.key} style={[styles.fineRow, i > 0 ? rowBorder : null]}>
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
                      <Text
                        style={[
                          styles.fineReason,
                          f.suspension ? styles.fineReasonSusp : null,
                        ]}
                      >
                        {f.reason}
                      </Text>
                    </View>
                    <Text
                      style={[styles.fineAmount, f.suspension ? { color: accent } : null]}
                    >
                      {f.amount}
                    </Text>
                  </View>
                ))}
                <ExpandButton
                  expanded={finesOpen}
                  total={fines.length}
                  onToggle={() => setFinesOpen((v) => !v)}
                  accent={accent}
                  copy={copy}
                />
              </View>
            </View>
          ) : null}
        </>
      )}

      <Text style={styles.note}>{copy.note}</Text>
    </View>
  );
}

/** Web `NbaTeamDisciplineSection` 相当（年切替付き） */
export function NbaTeamDisciplineSectionNative({
  teamId,
  initial,
  accent,
  isJa,
  onPlayerPress,
}: {
  teamId: string;
  initial: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  onPlayerPress?: (playerId: string) => void;
}) {
  const s = useNbaTeamDisciplineSeason({
    teamId,
    initial,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  return (
    <NbaDisciplineSectionNative
      slice={s.slice}
      accent={accent}
      isJa={isJa}
      showPlayerNames
      onPlayerPress={onPlayerPress}
      season={{
        seasonKey: s.seasonKey,
        seasonKeys: s.seasonKeys,
        onChange: s.setSeasonKey,
        loading: s.loading,
      }}
    />
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
  phaseRow: {
    flexDirection: "row",
    gap: 16,
  },
  phaseBtn: {
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
  phaseText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  phaseTextOn: {
    color: "#FFFFFF",
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
    color: "rgba(255,255,255,0.35)",
    fontVariant: ["tabular-nums"],
  },
  empty: {
    paddingVertical: 10,
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  block: {
    gap: 6,
  },
  subLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  box: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.4)",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  th: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    textAlign: "right",
  },
  td: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  colName: {
    flex: 1,
    minWidth: 0,
    textAlign: "left",
  },
  colN: {
    width: 24,
  },
  colSusp: {
    width: 32,
  },
  colFines: {
    width: 52,
  },
  expand: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 7,
    alignItems: "center",
  },
  expandText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
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
  fineReasonSusp: {
    color: "rgba(255,255,255,0.8)",
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
