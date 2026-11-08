import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import type { NbaPlayerGameLog } from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaTeamUpcomingGame } from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaLeagueTeamStatRow } from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import { fetchTeamGameLog } from "../../../../../../lib/nba/teamGameLog/fetchTeamGameLogClient";
import { rankTeamsByMetric } from "../../../../../../lib/nba/insights/rankTeamMetrics";
import { getTeamPrimaryColor } from "../../../../../../lib/team-colors";
import {
  NBA_PLAYER_LOG_STAT_LABEL,
  averagePlayerLogStat,
  buildPlayerHitRates,
  buildPlayerSeasonHighs,
  buildPlayerTrendPoints,
  buildPlayerVsTeamSummary,
  type NbaPlayerLogStatKey,
} from "../../../../../../lib/nba/playerDetail/playerGameLogInsights";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { nbaPlayerDetailChrome } from "./nbaPlayerDetailChromeCopy";

const FORM_WIN = "#00F5FF";
const FORM_LOSS = "#FF2D78";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.titleLine} />
    </View>
  );
}

function StatChips({
  keys,
  value,
  onChange,
  accent,
}: {
  keys: NbaPlayerLogStatKey[];
  value: NbaPlayerLogStatKey;
  onChange: (k: NbaPlayerLogStatKey) => void;
  accent: string;
}) {
  return (
    <View style={[styles.chips, { borderColor: hexToRgba(accent, 0.35) }]}>
      {keys.map((k) => {
        const active = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            style={[styles.chip, active ? { backgroundColor: accent } : null]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? "#050508" : "rgba(255,255,255,0.55)" },
              ]}
            >
              {NBA_PLAYER_LOG_STAT_LABEL[k]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** OVERVIEW — 次の試合と、その相手との今季対戦 */
export function NbaPlayerNextGameNative({
  teamId,
  seasonLogs,
  teamStatRows,
  apiBaseUrl,
  accent,
  language,
  trailingDivider,
}: {
  trailingDivider?: StyleProp<ViewStyle>;
  teamId: string;
  seasonLogs: NbaPlayerGameLog[];
  teamStatRows: NbaLeagueTeamStatRow[];
  apiBaseUrl: string | null;
  accent: string;
  language: string;
}) {
  const chrome = nbaPlayerDetailChrome(language);
  const [next, setNext] = useState<NbaTeamUpcomingGame | null>(null);

  useEffect(() => {
    if (!teamId) return;
    const abort = new AbortController();
    setNext(null);
    fetchTeamGameLog({ apiBaseUrl, teamId, signal: abort.signal })
      .then((payload) => {
        const cutoff = Date.now() - 3 * 60 * 60 * 1000;
        const game =
          payload.log.upcomingGames.find((g) => g.startMs == null || g.startMs > cutoff) ?? null;
        setNext(game);
      })
      .catch(() => {});
    return () => abort.abort();
  }, [teamId, apiBaseUrl]);

  const vs = useMemo(
    () => (next ? buildPlayerVsTeamSummary(seasonLogs, next.oppTeamId) : null),
    [next, seasonLogs]
  );
  const defense = useMemo(() => {
    if (!next || teamStatRows.length === 0) return null;
    const row = teamStatRows.find((r) => r.teamId === next.oppTeamId);
    if (!row) return null;
    const paceRank = [...teamStatRows]
      .sort((a, b) => b.pace - a.pace)
      .findIndex((r) => r.teamId === next.oppTeamId) + 1;
    return [
      { label: "DRTG", value: row.drtg.toFixed(1), rank: rankTeamsByMetric(teamStatRows, "drtg").get(row.teamId) },
      { label: "OPP eFG%", value: (row.oppEfgPct > 1 ? row.oppEfgPct : row.oppEfgPct * 100).toFixed(1), rank: rankTeamsByMetric(teamStatRows, "oppEfgPct").get(row.teamId) },
      { label: "PACE", value: row.pace.toFixed(1), rank: paceRank > 0 ? paceRank : undefined },
    ];
  }, [next, teamStatRows]);

  if (!next || !vs) return null;
  const oppColor = getTeamPrimaryColor("nba", next.oppTeamId) ?? "#FFFFFF";
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  const last = vs.meetings[0];

  return (
    <View style={styles.wrap}>
      <SectionTitle title="NEXT GAME" />
      <View style={[styles.card, { borderColor: frame }]}>
        <View style={styles.nextHead}>
          <Text style={styles.nextVs}>
            {next.home ? "vs" : "@"}{" "}
            <Text style={{ color: oppColor }}>{next.oppAbbr}</Text>
          </Text>
          <Text style={styles.nextWhen}>
            {next.dateLabel}
            {next.tipLabel ? `  ${next.tipLabel}` : ""}
          </Text>
        </View>

        <View style={[styles.cardSection, { borderTopColor: line }]}>
          <Text style={styles.hint}>{chrome.nextGameVsHint}</Text>
          {vs.games === 0 ? (
            <Text style={styles.empty}>{chrome.nextGameNoMeeting}</Text>
          ) : (
            <>
              <View style={styles.statRow}>
                <StatBox label="GP" value={String(vs.games)} />
                <StatBox label="MIN" value={fmt(vs.min)} />
                <StatBox label="PTS" value={fmt(vs.pts)} strong />
                <StatBox label="REB" value={fmt(vs.reb)} />
                <StatBox label="AST" value={fmt(vs.ast)} />
                <StatBox label="3PM" value={fmt(vs.fg3m)} />
              </View>
              {last ? (
                <Text style={styles.lastMeeting}>
                  {chrome.nextGameLastMeeting} {last.dateLabel}{" "}
                  <Text style={{ color: last.result === "W" ? FORM_WIN : FORM_LOSS }}>
                    {last.result}
                  </Text>
                  {"  "}
                  {last.pts} PTS · {last.reb} REB · {last.ast} AST
                </Text>
              ) : null}
            </>
          )}
        </View>

        {defense ? (
          <View style={[styles.cardSection, { borderTopColor: line }]}>
            <Text style={styles.hint}>{chrome.nextGameOppDefense}</Text>
            <View style={styles.statRow}>
              {defense.map((d) => (
                <StatBox
                  key={d.label}
                  label={d.label}
                  value={d.value}
                  sub={d.rank ? `#${d.rank}` : undefined}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
      {trailingDivider ? <View style={trailingDivider} /> : null}
    </View>
  );
}

function StatBox({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, strong ? styles.statStrong : null]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const TREND_KEYS: NbaPlayerLogStatKey[] = ["pts", "reb", "ast", "fg3m", "min"];
const CHART_H = 132;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 8;

/** GAMES — 直近 20 試合の推移 */
export function NbaPlayerTrendChartNative({
  seasonLogs,
  accent,
  language,
  trailingDivider,
}: {
  trailingDivider?: StyleProp<ViewStyle>;
  seasonLogs: NbaPlayerGameLog[];
  accent: string;
  language: string;
}) {
  const chrome = nbaPlayerDetailChrome(language);
  const [stat, setStat] = useState<NbaPlayerLogStatKey>("pts");
  const [width, setWidth] = useState(0);
  const points = useMemo(() => buildPlayerTrendPoints(seasonLogs, stat), [seasonLogs, stat]);
  const avg = useMemo(() => averagePlayerLogStat(seasonLogs, stat), [seasonLogs, stat]);
  if (points.length < 2 || avg == null) return null;

  const maxV = Math.max(avg, ...points.map((p) => p.value), 1) * 1.1;
  const innerW = Math.max(0, width - PAD_X * 2);
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_X + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  const y = (v: number) => PAD_TOP + innerH - (innerH * v) / maxV;
  const high = Math.max(...points.map((p) => p.value));
  const low = Math.min(...points.map((p) => p.value));
  const frame = hexToRgba(accent, 0.3);

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <SectionTitle title="TREND" />
      </View>
      <StatChips keys={TREND_KEYS} value={stat} onChange={setStat} accent={accent} />
      <Text style={styles.hint}>{chrome.trendHint}</Text>
      <View
        style={[styles.chartBox, { borderColor: frame }]}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <Svg width={width} height={CHART_H}>
            <Line
              x1={PAD_X}
              x2={width - PAD_X}
              y1={y(avg)}
              y2={y(avg)}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <Polyline
              points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
              fill="none"
              stroke={accent}
              strokeWidth={2}
            />
            {points.map((p, i) => (
              <Circle
                key={`${p.gameId}-${i}`}
                cx={x(i)}
                cy={y(p.value)}
                r={3.5}
                fill={p.value >= avg ? accent : "#050508"}
                stroke={accent}
                strokeWidth={1.5}
              />
            ))}
          </Svg>
        ) : (
          <View style={{ height: CHART_H }} />
        )}
        <View style={styles.chartFoot}>
          <Text style={styles.chartFootText}>{points[0].dateLabel}</Text>
          <Text style={styles.chartFootText}>
            AVG {fmt(avg)} · HIGH {high} · LOW {low}
          </Text>
          <Text style={styles.chartFootText}>{points[points.length - 1].dateLabel}</Text>
        </View>
      </View>
      {trailingDivider ? <View style={trailingDivider} /> : null}
    </View>
  );
}

/** GAMES — 今季ハイと達成率 */
export function NbaPlayerHighsAndHitRatesNative({
  seasonLogs,
  accent,
  language,
}: {
  seasonLogs: NbaPlayerGameLog[];
  accent: string;
  language: string;
}) {
  const chrome = nbaPlayerDetailChrome(language);
  const highs = useMemo(() => buildPlayerSeasonHighs(seasonLogs), [seasonLogs]);
  const hitRates = useMemo(() => buildPlayerHitRates(seasonLogs), [seasonLogs]);
  if (seasonLogs.length === 0) return null;
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.1);
  const pct = (h: number, g: number) => (g > 0 ? Math.round((100 * h) / g) : 0);

  return (
    <View style={styles.wrap}>
      <SectionTitle title="SEASON HIGHS" />
      <View style={[styles.highGrid, { borderColor: frame }]}>
        {highs.map((h, i) => (
          <View
            key={h.key}
            style={[
              styles.highCell,
              i % 3 !== 2 ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: line } : null,
              i < highs.length - 3 ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: line } : null,
            ]}
          >
            <Text style={styles.statLabel}>{NBA_PLAYER_LOG_STAT_LABEL[h.key]}</Text>
            <Text style={[styles.highValue, { color: accent }]}>{h.value}</Text>
            <Text style={styles.highGame} numberOfLines={1}>
              {h.log.dateLabel} {h.log.home ? "vs" : "@"} {h.log.oppAbbr}
            </Text>
          </View>
        ))}
      </View>

      {hitRates.length > 0 ? (
        <>
          <View style={{ height: 6 }} />
          <SectionTitle title="HIT RATE" />
          <Text style={styles.hint}>{chrome.hitRateHint}</Text>
          <View style={[styles.card, { borderColor: frame }]}>
            {hitRates.map((r, i) => {
              const sp = pct(r.season.hits, r.season.games);
              const lp = pct(r.last10.hits, r.last10.games);
              return (
                <View
                  key={`${r.key}-${r.threshold}`}
                  style={[
                    styles.hitRow,
                    i < hitRates.length - 1
                      ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: line }
                      : null,
                  ]}
                >
                  <Text style={styles.hitLabel}>
                    {NBA_PLAYER_LOG_STAT_LABEL[r.key]} {r.threshold}+
                  </Text>
                  <HitBar pct={sp} accent={accent} />
                  <Text style={styles.hitValue}>
                    {r.season.hits}/{r.season.games}
                  </Text>
                  <Text style={[styles.hitPct, { color: sp >= 50 ? accent : "rgba(255,255,255,0.6)" }]}>
                    {sp}%
                  </Text>
                  <Text style={styles.hitL10}>
                    L10 {r.last10.hits}/{r.last10.games}
                    <Text style={{ color: lp > sp ? FORM_WIN : lp < sp ? FORM_LOSS : "rgba(255,255,255,0.5)" }}>
                      {lp > sp ? " ▲" : lp < sp ? " ▼" : ""}
                    </Text>
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

function HitBar({ pct, accent }: { pct: number; accent: string }) {
  return (
    <View style={styles.hitBarTrack}>
      <View style={[styles.hitBarFill, { width: `${pct}%`, backgroundColor: hexToRgba(accent, 0.75) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  title: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  titleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  headRow: { flexDirection: "row", alignItems: "center" },
  hint: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    lineHeight: 14,
  },
  empty: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.55)",
  },
  cardSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  nextHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  nextVs: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 20,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  nextWhen: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
  },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statBox: { alignItems: "center", flex: 1, gap: 2 },
  statLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  statStrong: { color: "#FFFFFF", fontWeight: "800" },
  statSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
  },
  lastMeeting: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
  },
  chips: { flexDirection: "row", borderWidth: 1, alignSelf: "flex-start", overflow: "hidden" },
  chip: { paddingHorizontal: 10, paddingVertical: 5 },
  chipText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  chartBox: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.55)",
  },
  chartFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  chartFootText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
  },
  highGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.55)",
  },
  highCell: {
    width: "33.333%",
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
  },
  highValue: {
    fontFamily: METRIC_FONT,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  highGame: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
  },
  hitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 36,
    gap: 8,
  },
  hitLabel: {
    width: 64,
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    transform: [{ skewX: "-6deg" }],
  },
  hitBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  hitBarFill: { height: 6 },
  hitValue: {
    width: 40,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  hitPct: {
    width: 36,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  hitL10: {
    width: 70,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
