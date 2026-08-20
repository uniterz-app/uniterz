/** Web `HowTheyPlayBoard` 相当 — チーム詳細の HOW THEY PLAY */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import {
  TEAM_HOW_THEY_PLAY_TABS,
  getTeamHowTheyPlay,
  type TeamHowTheyPlayTab,
} from "../../../../../../lib/predict/nbaTeamDetailHowTheyPlay";
import type { NbaLeagueTeamStatsBundle } from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";

const CYAN = "#00F5FF";
const OWN = "#FF3D5A";
const OPP = "#3BA0FF";
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
  const r = Math.max(1, Math.min(30, rank));
  const bucket = Math.min(LEAGUE_RANK_SEGMENTS - 1, Math.floor((r - 1) / 5));
  return ((LEAGUE_RANK_SEGMENTS - bucket) / LEAGUE_RANK_SEGMENTS) * 100;
}

function rankTone(rank: number, accent: string): string {
  return rank <= 10 ? accent : "rgba(255,255,255,0.35)";
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
        <Text style={[styles.ffRank, { color: rankTone(rank, accent) }]}>#{rank}</Text>
      </View>
      <Text style={styles.hintVal}>
        {display}
        {unit ? <Text style={styles.pppUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

type Props = {
  teamId: string;
  accent: string;
  isJa: boolean;
  bundle?: NbaLeagueTeamStatsBundle;
};

export default function NbaTeamHowTheyPlayNative({
  teamId,
  accent,
  isJa,
  bundle,
}: Props) {
  const board = useMemo(
    () => getTeamHowTheyPlay(teamId, bundle),
    [teamId, bundle]
  );
  const [tab, setTab] = useState<TeamHowTheyPlayTab>("fourFactors");
  const [factorId, setFactorId] = useState("efg");
  const [hustleId, setHustleId] = useState("deflections");
  const [trackId, setTrackId] = useState("drives");
  if (!board) return null;

  const tabMeta = TEAM_HOW_THEY_PLAY_TABS.find((t) => t.id === tab)!;
  const factor =
    board.fourFactors.find((r) => r.id === factorId) ?? board.fourFactors[0]!;
  const hustle =
    board.hustle.find((r) => r.id === hustleId) ?? board.hustle[0]!;
  const tracking =
    board.tracking.find((r) => r.id === trackId) ?? board.tracking[0]!;
  const frame = hexToRgba(accent, 0.4);
  const line = hexToRgba(accent, 0.15);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: hexToRgba(accent, 0.75) }]}>
          HOW THEY PLAY
        </Text>
        <View
          style={[styles.titleLine, { backgroundColor: hexToRgba(accent, 0.35) }]}
        />
      </View>

      <View style={styles.chipRow}>
        {TEAM_HOW_THEY_PLAY_TABS.map((t) => {
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
        <View style={[styles.card, { borderColor: frame }]}>
          <View style={[styles.ffHead, { borderBottomColor: line }]}>
            <Text style={styles.ffHeadSpacer} />
            <Text style={[styles.ffHeadLabel, { color: OWN }]}>
              {isJa ? "自分" : "US"}
            </Text>
            <Text style={[styles.ffHeadLabel, { color: OPP }]}>
              {isJa ? "相手" : "THEM"}
            </Text>
          </View>
          {board.fourFactors.map((row) => {
            const active = row.id === factor.id;
            return (
              <Pressable
                key={row.id}
                onPress={() => setFactorId(row.id)}
                style={[
                  styles.ffRow,
                  { borderTopColor: line },
                  active ? { backgroundColor: hexToRgba(accent, 0.08) } : null,
                ]}
              >
                <Text style={styles.ffName}>{row.short}</Text>
                <View style={styles.ffCell}>
                  <Text style={[styles.ffVal, { color: OWN }]}>
                    {row.own.display}
                  </Text>
                  <Text style={[styles.ffRank, { color: rankTone(row.own.rank, accent) }]}>
                    #{row.own.rank}
                  </Text>
                </View>
                <View style={styles.ffCell}>
                  <Text style={[styles.ffVal, { color: OPP }]}>
                    {row.opp.display}
                  </Text>
                  <Text style={[styles.ffRank, { color: rankTone(row.opp.rank, accent) }]}>
                    #{row.opp.rank}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {tab === "fourFactors" ? (
        <Text style={styles.detailHint}>
          {isJa ? factor.hintJa : factor.hintEn}
        </Text>
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
                i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: line } : null,
              ]}
            >
              <View style={styles.barTop}>
                <Text style={styles.hustleName}>{row.short}</Text>
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
                replayKey={`${teamId}-${row.id}`}
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
                <Text style={[styles.clutchRank, { color: rankTone(row.cell.rank, accent) }]}>
                  #{row.cell.rank}
                </Text>
              </View>
              <Text style={styles.clutchVal}>{row.cell.display}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "hustle" || tab === "tracking" ? (
        <>
          <View style={[styles.card, { borderColor: frame }]}>
            {(tab === "hustle" ? board.hustle : board.tracking).map((row, i) => {
              const selected = tab === "hustle" ? hustle : tracking;
              const active = row.id === selected.id;
              return (
                <Pressable
                  key={row.id}
                  onPress={() =>
                    tab === "hustle" ? setHustleId(row.id) : setTrackId(row.id)
                  }
                  style={[
                    styles.hintRow,
                    i > 0
                      ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: line }
                      : null,
                    active ? { backgroundColor: hexToRgba(accent, 0.08) } : null,
                  ]}
                >
                  <Text style={styles.hustleName}>{row.short}</Text>
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
            {tab === "hustle"
              ? isJa
                ? hustle.hintJa
                : hustle.hintEn
              : isJa
                ? tracking.hintJa
                : tracking.hintEn}
          </Text>
        </>
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
  ffHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ffHeadSpacer: { width: 52 },
  ffHeadLabel: {
    flex: 1,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  ffRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
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
  hustleName: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    transform: [{ skewX: "-6deg" }],
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
    width: 52,
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    transform: [{ skewX: "-6deg" }],
  },
  ffCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    gap: 4,
  },
  ffVal: {
    fontFamily: METRIC_FONT,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
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
