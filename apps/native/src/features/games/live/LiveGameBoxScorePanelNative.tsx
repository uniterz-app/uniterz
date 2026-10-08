/** Web `LiveGameBoxScorePanel` 相当 — チーム色グラデ枠 + BASIC/ADVANCED */
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { playerCardName } from "../../../../../../lib/predict/nbaRoster";
import type {
  LiveGameBoxTeam,
  LiveGameStatsReport,
} from "../../../../../../lib/games/liveGameStats";
import {
  activeLiveGameBoxSort,
  liveGameBoxColumnValues,
  liveGameBoxColumns,
  liveGameBoxHasAdvancedData,
  nextLiveGameBoxSort,
  sortLiveGameBoxPlayers,
  type LiveGameBoxScoreMode,
  type LiveGameBoxSort,
} from "../../../../../../lib/games/liveGameBoxScoreColumns";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../../lib/team-colors";
import JerseyMarkSvg from "../JerseyMarkSvg";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const IDENTITY_W = 176;
/** ヘッダーの ▼▲ が入る幅（ロスター表と同じ） */
const STAT_COL_W = 48;
const ROW_H = 40;
const HEAD_H = 28;

type Props = {
  report: LiveGameStatsReport;
  onOpenPlayerDetail?: (playerId: string) => void;
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function BoxScoreModeToggle({
  mode,
  onChange,
  advancedAvailable,
}: {
  mode: LiveGameBoxScoreMode;
  onChange: (mode: LiveGameBoxScoreMode) => void;
  advancedAvailable: boolean;
}) {
  const tabs: { id: LiveGameBoxScoreMode; label: string }[] = [
    { id: "basic", label: "BASIC" },
    { id: "advanced", label: "ADVANCED" },
  ];
  return (
    <View style={styles.modeRow}>
      {tabs.map((tab) => {
        const active = mode === tab.id;
        const disabled = tab.id === "advanced" && !advancedAvailable;
        return (
          <Pressable
            key={tab.id}
            disabled={disabled}
            onPress={() => onChange(tab.id)}
            style={[
              styles.modeBtn,
              active ? styles.modeBtnActive : styles.modeBtnIdle,
              disabled ? styles.modeBtnDisabled : null,
            ]}
          >
            <Text
              style={[
                styles.modeBtnText,
                active ? styles.modeBtnTextActive : styles.modeBtnTextIdle,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TeamBoxCard({
  block,
  mode,
  onOpenPlayerDetail,
}: {
  block: LiveGameBoxTeam;
  mode: LiveGameBoxScoreMode;
  onOpenPlayerDetail?: (playerId: string) => void;
}) {
  /** false = 出場選手のみ / true = 未出場まで */
  const [open, setOpen] = useState(false);
  const teamPrimary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const jerseySecondary = getTeamJerseySecondaryColor("nba", block.teamId);
  const border = hexToRgba(teamPrimary, 0.55);
  const divider = hexToRgba(teamPrimary, 0.22);
  const sideLabel = block.side === "home" ? "HOME" : "AWAY";
  const [sort, setSort] = useState<LiveGameBoxSort>(null);
  const activeSort = activeLiveGameBoxSort(sort, mode);
  const sorted = useMemo(
    () => sortLiveGameBoxPlayers(block.players, sort, mode),
    [block.players, sort, mode]
  );
  const played = sorted.filter((p) => p.min > 0);
  const dnpCount = sorted.length - played.length;
  // 開始直後で誰も出場記録が無いときは全員を出す
  const players = open || played.length === 0 ? sorted : played;
  const showDnpToggle = dnpCount > 0 && played.length > 0;
  const columns = liveGameBoxColumns(mode);

  return (
    <View style={[styles.card, { borderColor: border }]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.header,
          {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: divider,
          },
          pressed ? styles.headerPressed : null,
        ]}
      >
        <JerseyMarkSvg
          accent={teamPrimary}
          accentEnd={jerseySecondary}
          size={36}
        />
        <View style={styles.headerText}>
          <View style={styles.headerTop}>
            <Text
              style={[styles.sideTag, { borderColor: teamPrimary, color: teamPrimary }]}
            >
              {sideLabel}
            </Text>
            <Text style={styles.teamName} numberOfLines={1}>
              {block.teamName}
            </Text>
          </View>
        </View>
        {showDnpToggle ? (
          <MaterialCommunityIcons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={teamPrimary}
          />
        ) : null}
      </Pressable>

      {players.length > 0 ? (
        <View style={styles.tableWrap}>
          <View style={styles.identityColumn}>
            <Pressable
              style={[styles.tableHead, styles.identityHead]}
              onPress={() => setSort(null)}
              accessibilityRole="button"
              accessibilityLabel="Reset box score sort"
            >
              <Text style={styles.thJersey}>#</Text>
              <Text style={styles.thPlayer}>Player</Text>
              <Text style={styles.thPos}>Pos</Text>
            </Pressable>
            {players.map((p) => {
              const onPress =
                onOpenPlayerDetail && p.playerId
                  ? () => onOpenPlayerDetail(p.playerId)
                  : undefined;
              const inner = (
                <>
                  <View style={[styles.jersey, { borderColor: teamPrimary }]}>
                    <Text style={[styles.jerseyNum, { color: teamPrimary }]}>
                      {p.jerseyNumber}
                    </Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {playerCardName(p)}
                  </Text>
                  <Text style={styles.pos}>{p.position}</Text>
                </>
              );
              return onPress ? (
                <Pressable
                  key={p.playerId}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.tableRow,
                    styles.identityRow,
                    pressed ? styles.tableRowPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={playerCardName(p)}
                >
                  {inner}
                </Pressable>
              ) : (
                <View key={p.playerId} style={[styles.tableRow, styles.identityRow]}>
                  {inner}
                </View>
              );
            })}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statsPad}>
              <View style={styles.tableHead}>
                {columns.map((c) => {
                  const active = activeSort?.key === c.key;
                  const marker = active
                    ? activeSort.dir === "desc"
                      ? " ▼"
                      : " ▲"
                    : "";
                  return (
                    <Pressable
                      key={c.key}
                      onPress={() => setSort((prev) => nextLiveGameBoxSort(prev, c.key))}
                      style={styles.thStatPress}
                      accessibilityRole="button"
                      accessibilityLabel={`Sort by ${c.label}`}
                    >
                      <Text
                        style={[styles.thStat, active ? styles.thStatActive : null]}
                        numberOfLines={1}
                      >
                        {c.label}
                        {marker}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {players.map((p) => {
                const values = liveGameBoxColumnValues(p, mode);
                const cells = values.map((v, i) => {
                  const col = columns[i];
                  if (!col) return null;
                  return (
                    <Text
                      key={col.key}
                      style={[
                        styles.stat,
                        col.emphasis ? styles.statEmphasis : styles.statMuted,
                      ]}
                    >
                      {v}
                    </Text>
                  );
                });
                return onOpenPlayerDetail && p.playerId ? (
                  <Pressable
                    key={p.playerId}
                    onPress={() => onOpenPlayerDetail(p.playerId)}
                    style={({ pressed }) => [
                      styles.tableRow,
                      pressed ? styles.tableRowPressed : null,
                    ]}
                  >
                    {cells}
                  </Pressable>
                ) : (
                  <View key={p.playerId} style={styles.tableRow}>
                    {cells}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ) : null}
      {showDnpToggle ? (
        <Pressable
          onPress={() => setOpen((v) => !v)}
          style={({ pressed }) => [
            styles.dnpToggle,
            { borderTopColor: divider },
            pressed ? styles.headerPressed : null,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <Text style={styles.dnpToggleText}>
            {open ? "HIDE DNP" : `DNP · ${dnpCount}`}
          </Text>
          <MaterialCommunityIcons
            name={open ? "chevron-up" : "chevron-down"}
            size={12}
            color="rgba(255,255,255,0.45)"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function LiveGameBoxScorePanelNative({
  report,
  onOpenPlayerDetail,
}: Props) {
  const allPlayers = useMemo(
    () => [...report.box.home.players, ...report.box.away.players],
    [report.box.home.players, report.box.away.players]
  );
  const advancedAvailable = liveGameBoxHasAdvancedData(allPlayers);
  const [mode, setMode] = useState<LiveGameBoxScoreMode>("basic");

  return (
    <View style={styles.stack}>
      <BoxScoreModeToggle
        mode={mode}
        onChange={setMode}
        advancedAvailable={advancedAvailable}
      />
      <TeamBoxCard
        block={report.box.home}
        mode={mode}
        onOpenPlayerDetail={onOpenPlayerDetail}
      />
      <TeamBoxCard
        block={report.box.away}
        mode={mode}
        onOpenPlayerDetail={onOpenPlayerDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  modeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
  },
  modeBtn: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modeBtnActive: {
    borderColor: "#00F5FF",
    backgroundColor: "#00F5FF",
  },
  modeBtnIdle: {
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
  },
  modeBtnDisabled: { opacity: 0.35 },
  modeBtnText: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  modeBtnTextActive: { color: "#050508" },
  modeBtnTextIdle: { color: "rgba(255,255,255,0.55)" },
  card: {
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  sideTag: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  teamName: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#fff",
  },
  tableWrap: { flexDirection: "row", paddingBottom: 8 },
  identityColumn: {
    width: IDENTITY_W,
    paddingLeft: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#000",
  },
  identityHead: { gap: 5, paddingRight: 6 },
  identityRow: { gap: 5, paddingRight: 6 },
  statsPad: { paddingRight: 8 },
  tableHead: {
    height: HEAD_H,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  tableRow: {
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  tableRowPressed: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  thJersey: {
    width: 26,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thPlayer: {
    flex: 1,
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thPos: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thStatPress: {
    width: STAT_COL_W,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  thStat: {
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  thStatActive: { color: "#00E5FF" },
  jersey: {
    width: 26,
    height: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyNum: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  playerName: {
    maxWidth: 96,
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    color: "#fff",
    transform: [{ skewX: "-6deg" }],
  },
  pos: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    transform: [{ skewX: "-6deg" }],
  },
  stat: {
    width: STAT_COL_W,
    textAlign: "center",
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  dnpToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dnpToggleText: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  statEmphasis: { color: "#fff" },
  statMuted: { color: "rgba(255,255,255,0.78)" },
});
