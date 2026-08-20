/** Web `NbaPlayerHowTheyPlay` 相当 — PERFORMANCE + HOW THEY PLAY */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import {
  PLAYER_HOW_THEY_PLAY_TABS,
  getPlayerHowTheyPlay,
  isPlayerDetailRankShown,
  type PlayerHowRow,
  type PlayerHowTheyPlayTab,
} from "../../../../../../lib/predict/nbaPlayerDetailHowTheyPlay";
import type { NbaPlayerDetailPreview } from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerStatLeadersBundle } from "../../../../../../lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaLeagueTeamStatsBundle } from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";

const CYAN = "#00F5FF";
const LEAGUE_RANK_SEGMENTS = 6;

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function leagueRankSegPct(rank: number): number {
  const r = Math.max(1, Math.min(120, rank));
  const bucket = Math.min(LEAGUE_RANK_SEGMENTS - 1, Math.floor((r - 1) / 20));
  return ((LEAGUE_RANK_SEGMENTS - bucket) / LEAGUE_RANK_SEGMENTS) * 100;
}

function rankTone(rank: number, accent: string): string {
  return rank <= 10 ? accent : "rgba(255,255,255,0.35)";
}

function RankTag({
  rank,
  accent,
  style,
}: {
  rank: number;
  accent: string;
  style?: object;
}) {
  if (!isPlayerDetailRankShown(rank)) return null;
  return (
    <Text style={[{ color: rankTone(rank, accent) }, style]}>#{rank}</Text>
  );
}

function ChipScan() {
  const lines: number[] = [];
  for (let y = 2; y <= 40; y += 3) lines.push(y);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {lines.map((y) => (
        <View
          key={y}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: y,
            height: 1,
            backgroundColor: "rgba(0,0,0,0.2)",
          }}
        />
      ))}
    </View>
  );
}

function HowPtsCol({ display }: { display?: string }) {
  return (
    <View style={styles.ptsCol}>
      <Text style={styles.ptsUnit}>{display ? "pts" : " "}</Text>
      <Text style={styles.ptsVal}>{display ?? " "}</Text>
    </View>
  );
}

function MetricStack({
  display,
  rank,
  accent,
  unit,
}: {
  display: string;
  rank: number;
  accent: string;
  unit?: string;
}) {
  return (
    <View style={styles.metricStack}>
      <View style={styles.rankSlot}>
        <RankTag rank={rank} accent={accent} style={styles.ffRank} />
      </View>
      <Text style={styles.hintVal}>
        {display}
        {unit ? <Text style={styles.pppUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function HintList({
  rows,
  selectedId,
  onSelect,
  accent,
  isJa,
  line,
  frame,
}: {
  rows: PlayerHowRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  accent: string;
  isJa: boolean;
  line: string;
  frame: string;
}) {
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0]!;
  return (
    <>
      <View style={[styles.card, { borderColor: frame }]}>
        {rows.map((row, i) => {
          const active = row.id === selected.id;
          return (
            <Pressable
              key={row.id}
              onPress={() => onSelect(row.id)}
              style={[
                styles.hintRow,
                i > 0
                  ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: line }
                  : null,
                active ? { backgroundColor: hexToRgba(accent, 0.08) } : null,
              ]}
            >
              <Text style={styles.ffName}>{row.short}</Text>
              <HowPtsCol display={row.pts?.display} />
              <MetricStack
                display={row.cell.display}
                rank={row.cell.rank}
                accent={accent}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.detailHint}>
        {isJa ? selected.hintJa : selected.hintEn}
      </Text>
    </>
  );
}

type Props = {
  playerId: string;
  accent: string;
  isJa: boolean;
  leaders?: NbaPlayerStatLeadersBundle;
  teamStats?: NbaLeagueTeamStatsBundle;
  detail?: NbaPlayerDetailPreview;
};

export default function NbaPlayerHowTheyPlayNative({
  playerId,
  accent,
  isJa,
  leaders,
  teamStats,
  detail,
}: Props) {
  const board = useMemo(
    () => getPlayerHowTheyPlay(playerId, { leaders, teamStats, detail }),
    [playerId, leaders, teamStats, detail]
  );
  const [tab, setTab] = useState<PlayerHowTheyPlayTab>("fourFactors");
  const [factorId, setFactorId] = useState("efg_pct");
  const [defenseId, setDefenseId] = useState("matchup_fg_pct");
  const [hustleId, setHustleId] = useState("deflections");
  const [trackId, setTrackId] = useState("drives");
  const tabMeta = PLAYER_HOW_THEY_PLAY_TABS.find((t) => t.id === tab)!;
  const frame = hexToRgba(accent, 0.4);
  const line = hexToRgba(accent, 0.15);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: hexToRgba(accent, 0.75) }]}>
          PERFORMANCE METRICS
        </Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
      </View>
      <View style={[styles.ratingGrid, { borderColor: frame }]}>
        {board.ratings.map((row, i) => {
          const col = i % 3;
          const lastRow = Math.floor((board.ratings.length - 1) / 3);
          const rowI = Math.floor(i / 3);
          return (
            <View
              key={row.id}
              style={[
                styles.ratingCell,
                col < 2
                  ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: line }
                  : null,
                rowI < lastRow
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: line }
                  : null,
              ]}
            >
              <View style={styles.clutchTop}>
                <Text style={styles.clutchShort}>{row.short}</Text>
                <RankTag rank={row.cell.rank} accent={accent} style={styles.clutchRank} />
              </View>
              <Text style={styles.clutchVal}>{row.cell.display}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.sectionRule, { backgroundColor: hexToRgba(accent, 0.2) }]} />

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: hexToRgba(accent, 0.75) }]}>
          HOW THEY PLAY
        </Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
      </View>

      <View style={styles.chipRow}>
        {PLAYER_HOW_THEY_PLAY_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {active ? <ChipScan /> : null}
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {t.short}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.tabHint}>
        {isJa ? tabMeta.hintJa : tabMeta.hintEn}
      </Text>

      {tab === "fourFactors" ? (
        <HintList
          rows={board.fourFactors}
          selectedId={factorId}
          onSelect={setFactorId}
          accent={accent}
          isJa={isJa}
          line={line}
          frame={frame}
        />
      ) : null}

      {tab === "scoring" ? (
        <View style={[styles.padCard, { borderColor: frame }]}>
          {board.scoring.map((row) => (
            <View key={row.id} style={styles.barBlock}>
              <View style={styles.barTop}>
                <Text style={styles.barLabel}>
                  {isJa ? row.labelJa : row.labelEn}
                </Text>
                <HowPtsCol display={row.pts.display} />
                <MetricStack
                  display={row.cell.display}
                  rank={row.cell.rank}
                  accent={accent}
                />
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(4, Math.min(100, row.cell.value * 100))}%`,
                      backgroundColor: accent,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "playtype" ? (
        <View style={[styles.card, { borderColor: frame }]}>
          {board.playtype.map((row, i) => (
            <View
              key={row.id}
              style={[
                styles.ptRow,
                i > 0
                  ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: line }
                  : null,
              ]}
            >
              <View style={styles.barTop}>
                <Text style={styles.ffName}>{row.short}</Text>
                <HowPtsCol display={row.pts.display} />
                <MetricStack
                  display={row.ppp.display}
                  rank={row.ppp.rank}
                  accent={accent}
                  unit="PPP"
                />
              </View>
              <View style={styles.ptBarRow}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(4, Math.min(100, row.freq.value * 120))}%`,
                        backgroundColor: accent,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.freqPct}>{row.freq.display}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "shooting" ? (
        <View style={[styles.padCard, { borderColor: frame }]}>
          {board.shooting.map((row) => (
            <View key={row.id} style={styles.shotBlock}>
              <View style={styles.barTop}>
                <Text style={styles.shotLabel}>
                  {isJa ? row.labelJa : row.labelEn}
                </Text>
                <HowPtsCol display={row.pts.display} />
                <MetricStack
                  display={row.cell.display}
                  rank={row.cell.rank}
                  accent={accent}
                />
              </View>
              <CyberSlantedSegBarNative
                pct={leagueRankSegPct(row.cell.rank)}
                segments={LEAGUE_RANK_SEGMENTS}
                compact
                accent={{
                  border: accent,
                  glow: hexToRgba(accent, 0.34),
                  bg: accent,
                }}
                forceStatic
                replayKey={`${playerId}-${row.id}`}
              />
            </View>
          ))}
        </View>
      ) : null}

      {tab === "clutch" ? (
        <View style={[styles.clutchRow, { borderColor: frame }]}>
          {board.clutch.map((row, i) => (
            <View
              key={row.id}
              style={[
                styles.clutchCell,
                i < board.clutch.length - 1
                  ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: line }
                  : null,
              ]}
            >
              <View style={styles.clutchTop}>
                <Text style={styles.clutchShort}>{row.short}</Text>
                <RankTag rank={row.cell.rank} accent={accent} style={styles.clutchRank} />
              </View>
              <Text style={styles.clutchVal}>{row.cell.display}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "defense" ? (
        <HintList
          rows={board.defense}
          selectedId={defenseId}
          onSelect={setDefenseId}
          accent={accent}
          isJa={isJa}
          line={line}
          frame={frame}
        />
      ) : null}

      {tab === "hustle" ? (
        <HintList
          rows={board.hustle}
          selectedId={hustleId}
          onSelect={setHustleId}
          accent={accent}
          isJa={isJa}
          line={line}
          frame={frame}
        />
      ) : null}

      {tab === "tracking" ? (
        <HintList
          rows={board.tracking}
          selectedId={trackId}
          onSelect={setTrackId}
          accent={accent}
          isJa={isJa}
          line={line}
          frame={frame}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  titleLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionRule: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: {
    width: "32%",
    maxWidth: "32%",
    flexGrow: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.26)",
    backgroundColor: "transparent",
    borderRadius: 2,
    paddingVertical: 11,
    alignItems: "center",
  },
  chipActive: {
    borderColor: CYAN,
    backgroundColor: CYAN,
  },
  chipLabel: {
    fontFamily: METRIC_FONT,
    color: CYAN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  chipLabelActive: { color: "#050508" },
  tabHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.68)",
    fontSize: 12,
    lineHeight: 16,
  },
  detailHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  padCard: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  ratingCell: {
    width: "33.333%",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  ptsCol: {
    width: 54,
    alignItems: "flex-end",
  },
  ptsVal: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  ptsUnit: {
    height: 12,
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metricStack: {
    width: 68,
    alignItems: "flex-end",
  },
  rankSlot: {
    height: 12,
    justifyContent: "center",
  },
  hintVal: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  ffName: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    transform: [{ skewX: "-6deg" }],
  },
  ffRank: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  barBlock: { gap: 4 },
  barTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  barValue: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    flex: 1,
  },
  barFill: { height: "100%" },
  ptRow: { paddingHorizontal: 10, paddingVertical: 10, gap: 6 },
  ptBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pppUnit: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
  },
  freqPct: {
    width: 40,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  shotBlock: { gap: 8 },
  shotLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  clutchRow: {
    flexDirection: "row",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  clutchCell: { flex: 1, paddingHorizontal: 10, paddingVertical: 12 },
  clutchTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clutchShort: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  clutchRank: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  clutchVal: {
    marginTop: 4,
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
});
