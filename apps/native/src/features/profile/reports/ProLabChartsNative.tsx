/**
 * PRO LAB の図。
 * 前: 金枠・塗り・Bebas。今: 選手 TREND の折れ線・平均破線・点。
 */
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polyline, Stop, Text as SvgText } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";
import { getTeamAbbrBadgeColor } from "../../../../../../lib/team-colors";
import type {
  ProLabCmp,
  ProLabDow,
  ProLabHour,
  ProLabSit,
  ProLabSplit,
  ProLabTeamBar,
  ProLabTrendPoint,
  ProLabVsPick,
} from "../../../../../../lib/reports/proLabPreviewMock";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { BEBAS, JP_400, JP_600 } from "./reportThemeNative";

export const CYAN = "#00F5FF";
export const GOLD = "#E8C66A";
export const LOSS = "#FF2D78";
const MUTED = "rgba(255,255,255,0.48)";
const INK = "rgba(255,255,255,0.9)";

export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(255,255,255,${alpha})`;
  const n = parseInt(raw, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function areaPath(pts: Array<{ x: number; y: number }>, baseY: number): string {
  if (!pts.length) return "";
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  return `${line} L${last.x.toFixed(1)},${baseY} L${first.x.toFixed(1)},${baseY} Z`;
}

export function ProLabTrendChartNative({
  points,
  width,
  leagueRate,
}: {
  points: ProLabTrendPoint[];
  width: number;
  leagueRate: number;
}) {
  const H = 168;
  const pad = { l: 28, r: 12, t: 16, b: 10 };
  const plotW = Math.max(40, width - pad.l - pad.r);
  const plotH = H - pad.t - pad.b;
  const avg = points.reduce((s, p) => s + p.rate, 0) / Math.max(points.length, 1);
  const yMin = 0.42;
  const yMax = 0.84;
  const x = (i: number) => pad.l + (points.length <= 1 ? 0 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => pad.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const xy = points.map((p, i) => ({ x: x(i), y: y(p.rate) }));
  const poly = xy.map((p) => `${p.x},${p.y}`).join(" ");
  const last = xy[xy.length - 1];
  const high = Math.max(...points.map((p) => p.rate));
  const low = Math.min(...points.map((p) => p.rate));
  const ticks = [0.5, 0.6, 0.7, 0.8];

  return (
    <View>
      <Svg width={width} height={H}>
        <Defs>
          <LinearGradient id="labYouFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CYAN} stopOpacity="0.32" />
            <Stop offset="1" stopColor={CYAN} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        {ticks.map((t) => (
          <G key={t}>
            <Line
              x1={pad.l}
              x2={width - pad.r}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(232,198,106,0.14)"
              strokeWidth={1}
              strokeDasharray="3 6"
            />
            <SvgText
              x={pad.l - 6}
              y={y(t) + 3}
              fill="rgba(255,255,255,0.42)"
              fontSize={9}
              fontFamily={METRIC_FONT}
              textAnchor="end"
            >
              {Math.round(t * 100)}
            </SvgText>
          </G>
        ))}
        <Path d={areaPath(xy, pad.t + plotH)} fill="url(#labYouFill)" />
        <Line
          x1={pad.l}
          x2={width - pad.r}
          y1={y(leagueRate)}
          y2={y(leagueRate)}
          stroke={GOLD}
          strokeWidth={1.2}
          strokeDasharray="5 4"
        />
        <Line
          x1={pad.l}
          x2={width - pad.r}
          y1={y(avg)}
          y2={y(avg)}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <Polyline points={poly} fill="none" stroke={CYAN} strokeWidth={2.4} />
        {points.map((p, i) => (
          <Circle
            key={p.t}
            cx={x(i)}
            cy={y(p.rate)}
            r={i === points.length - 1 ? 4.4 : 3}
            fill={p.rate >= avg ? CYAN : "#050508"}
            stroke={CYAN}
            strokeWidth={1.4}
          />
        ))}
        {last ? (
          <Circle cx={last.x} cy={last.y} r={8} fill="rgba(0,245,255,0.18)" />
        ) : null}
      </Svg>
      <View style={styles.legend}>
        <Key color={CYAN} label="自分" />
        <Key color="rgba(255,255,255,0.7)" dashed label="期間平均" />
        <Key color={GOLD} dashed label="全体平均" />
      </View>
      <View style={styles.chartFoot}>
        <Text style={styles.footTx}>開幕側</Text>
        <Text style={styles.footTx}>
          AVG {(avg * 100).toFixed(1)} · HI {(high * 100).toFixed(0)} · LO {(low * 100).toFixed(0)}
        </Text>
        <Text style={styles.footTx}>
          いま {((points[points.length - 1]?.rate ?? 0) * 100).toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

function Key({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.key}>
      <View style={[styles.keyLine, { backgroundColor: dashed ? "transparent" : color, borderColor: color }]} />
      <Text style={styles.keyLab}>{label}</Text>
    </View>
  );
}

export function ProLabCompareNative({ rows }: { rows: ProLabCmp[] }) {
  return (
    <View>
      {rows.map((r) => {
        const hi = Math.max(r.you, r.league, r.top10) * 1.08;
        const w = (v: number) => `${Math.max(6, Math.round((v / hi) * 100))}%` as `${number}%`;
        const ahead = r.invert ? r.you < r.league : r.you > r.league;
        return (
          <View key={r.key} style={styles.cmpBlock}>
            <View style={styles.cmpHead}>
              <Text style={styles.cmpLab}>{r.label}</Text>
              <Text style={[styles.cmpYouN, ahead ? null : { color: LOSS }]}>
                {r.you.toFixed(1)}
                {r.unit}
              </Text>
            </View>
            <View style={styles.cmpTrack}>
              <View style={[styles.cmpYouBar, { width: w(r.you) }]} />
              <View style={[styles.cmpTick, { left: w(r.league), backgroundColor: "rgba(255,255,255,0.7)" }]} />
              <View style={[styles.cmpTick, { left: w(r.top10), backgroundColor: GOLD }]} />
            </View>
            <Text style={styles.cmpSub}>
              全体 {r.league.toFixed(1)}
              {r.unit} · 上位10% {r.top10.toFixed(1)}
              {r.unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProLabStackNative({
  items,
}: {
  items: { label: string; share: number; pts: number }[];
}) {
  const palette = [CYAN, hexToRgba(CYAN, 0.55), GOLD, hexToRgba(GOLD, 0.55), "rgba(255,255,255,0.72)"];
  return (
    <View>
      <View style={styles.stack}>
        {items.map((it, i) => (
          <View
            key={it.label}
            style={{ flex: Math.max(it.share, 0.08), height: 12, backgroundColor: palette[i] ?? CYAN }}
          />
        ))}
      </View>
      {items.map((it, i) => (
        <View key={it.label} style={styles.stackRow}>
          <View style={[styles.stackDot, { backgroundColor: palette[i] ?? CYAN }]} />
          <Text style={styles.stackLab}>{it.label}</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.round(it.share * 100)}%` as `${number}%`, backgroundColor: palette[i] ?? CYAN },
              ]}
            />
          </View>
          <Text style={styles.stackPct}>{Math.round(it.share * 100)}%</Text>
          <Text style={styles.stackPts}>{it.pts}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProLabTeamBarsNative({ teams, baseline }: { teams: ProLabTeamBar[]; baseline: number }) {
  return (
    <View>
      {teams.map((t) => {
        const color = getTeamAbbrBadgeColor(t.teamId);
        const thin = t.games < 10;
        const below = t.rate < baseline;
        return (
          <View key={t.teamId} style={[styles.teamRow, thin && styles.thin]}>
            <Text style={[styles.teamAbbr, { color }]}>{t.abbr}</Text>
            <Text style={styles.gCount}>{t.games}G</Text>
            <View style={styles.barTrackTall}>
              <View
                style={[
                  styles.barFillTall,
                  {
                    width: `${Math.round(t.rate * 100)}%` as `${number}%`,
                    backgroundColor: hexToRgba(below ? LOSS : color, 0.9),
                  },
                ]}
              />
              <View style={[styles.baseMark, { left: `${Math.round(baseline * 100)}%` as `${number}%` }]} />
            </View>
            <Text style={[styles.teamPct, below && { color: LOSS }]}>{Math.round(t.rate * 100)}%</Text>
            <Text style={styles.teamPts}>{t.avgPts.toFixed(1)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProLabWeekNative({ days }: { days: ProLabDow[] }) {
  const max = Math.max(...days.map((d) => d.rate), 0.01);
  const best = Math.max(...days.map((d) => d.rate));
  return (
    <View style={styles.week}>
      {days.map((d) => {
        const hot = d.rate === best;
        return (
          <View key={d.label} style={styles.weekCol}>
            <View style={styles.weekWell}>
              <View
                style={[
                  styles.weekBar,
                  {
                    height: `${Math.round((d.rate / max) * 100)}%` as `${number}%`,
                    backgroundColor: hot ? GOLD : CYAN,
                  },
                ]}
              />
            </View>
            <Text style={[styles.weekLab, hot && { color: GOLD }]}>{d.label}</Text>
            <Text style={[styles.weekN, hot && { color: GOLD }]}>{Math.round(d.rate * 100)}</Text>
            <Text style={styles.weekG}>{d.n}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProLabHourNative({ hours }: { hours: ProLabHour[] }) {
  const best = Math.max(...hours.map((h) => h.rate));
  return (
    <View style={styles.hourGrid}>
      {hours.map((h) => {
        const hot = h.rate === best;
        return (
          <View key={h.label} style={[styles.hourCell, hot && styles.hourHot]}>
            <Text style={[styles.hourLab, hot && { color: GOLD }]}>{h.label}</Text>
            <Text style={[styles.hourVal, hot && { color: GOLD }]}>{Math.round(h.rate * 100)}%</Text>
            <Text style={styles.hourN}>{h.n} 予想</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProLabSitGridNative({ items }: { items: ProLabSit[] }) {
  return (
    <View style={styles.sitGrid}>
      {items.map((s) => (
        <View key={s.key} style={styles.sitCell}>
          <View style={[styles.sitWash, { opacity: 0.08 + s.rate * 0.45 }]} />
          <Text style={styles.sitLab}>{s.label}</Text>
          <Text style={styles.sitVal}>{Math.round(s.rate * 100)}%</Text>
          <Text style={styles.sitN}>{s.n} 試合</Text>
          <View style={styles.sitBarTrack}>
            <View style={[styles.sitBarFill, { width: `${Math.round(s.rate * 100)}%` as `${number}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProLabVsPickNative({ data }: { data: ProLabVsPick }) {
  const rows: Array<{ label: string; you: number; pro: number; unit: string; invert?: boolean }> = [
    { label: "勝敗的中", you: data.winner.you * 100, pro: data.winner.pro * 100, unit: "%" },
    { label: "得点王的中", you: data.scorer.you * 100, pro: data.scorer.pro * 100, unit: "%" },
    { label: "点差誤差", you: data.mae.you, pro: data.mae.pro, unit: "pt", invert: true },
  ];
  return (
    <View>
      <View style={styles.h2h}>
        <View style={styles.h2hCol}>
          <Text style={styles.h2hWho}>YOU</Text>
          <Text style={styles.h2hYou}>{data.h2h.you}</Text>
        </View>
        <View style={styles.h2hMid}>
          <Text style={styles.h2hDash}>—</Text>
          <Text style={styles.h2hSame}>同じ {data.h2h.same}</Text>
        </View>
        <View style={[styles.h2hCol, styles.h2hColR]}>
          <Text style={[styles.h2hWho, { color: GOLD }]}>PRO</Text>
          <Text style={styles.h2hPro}>{data.h2h.pro}</Text>
        </View>
      </View>
      <Text style={styles.h2hCap}>勝敗が分かれた試合だけ。同じ予想は右の「同じ」。</Text>
      {rows.map((r) => {
        const hi = Math.max(r.you, r.pro) * 1.12;
        const w = (v: number) => `${Math.max(8, Math.round((v / hi) * 100))}%` as `${number}%`;
        const ahead = r.invert ? r.you < r.pro : r.you > r.pro;
        return (
          <View key={r.label} style={styles.vsRow}>
            <View style={styles.cmpHead}>
              <Text style={styles.cmpLab}>{r.label}</Text>
              <Text style={[styles.cmpYouN, ahead ? null : { color: LOSS }]}>
                {r.you.toFixed(1)}
                {r.unit}
              </Text>
            </View>
            <View style={styles.habitTracks}>
              <View style={styles.habitTrack}>
                <View style={[styles.habitYouFill, { width: w(r.you) }]} />
              </View>
              <View style={styles.habitTrack}>
                <View style={[styles.vsProFill, { width: w(r.pro) }]} />
              </View>
            </View>
            <Text style={styles.cmpSub}>
              PRO PICK {r.pro.toFixed(1)}
              {r.unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProLabSplitGridNative({ items }: { items: ProLabSplit[] }) {
  return (
    <View style={styles.splitGrid}>
      {items.map((s) => {
        const ahead = s.win >= s.league;
        return (
          <View key={s.key} style={styles.splitCell}>
            <Text style={styles.splitLab}>{s.label}</Text>
            <Text style={[styles.splitVal, ahead ? null : { color: LOSS }]}>{Math.round(s.win * 100)}%</Text>
            <View style={styles.splitBarTrack}>
              <View style={[styles.splitYou, { width: `${Math.round(s.win * 100)}%` as `${number}%` }]} />
              <View style={[styles.splitMark, { left: `${Math.round(s.league * 100)}%` as `${number}%` }]} />
            </View>
            <Text style={styles.splitSub}>
              全体 {Math.round(s.league * 100)}% · {s.n} 試合
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProLabHabitBarsNative({
  rows,
}: {
  rows: { label: string; you: number; league: number }[];
}) {
  return (
    <View>
      {rows.map((r) => (
        <View key={r.label} style={styles.habitBlock}>
          <View style={styles.cmpHead}>
            <Text style={styles.cmpLab}>{r.label}</Text>
            <Text style={styles.cmpYouN}>{Math.round(r.you * 100)}%</Text>
          </View>
          <View style={styles.habitTracks}>
            <View style={styles.habitTrack}>
              <View style={[styles.habitYouFill, { width: `${Math.round(r.you * 100)}%` as `${number}%` }]} />
            </View>
            <View style={styles.habitTrack}>
              <View style={[styles.habitLgFill, { width: `${Math.round(r.league * 100)}%` as `${number}%` }]} />
            </View>
          </View>
          <Text style={styles.cmpSub}>全体 {Math.round(r.league * 100)}%</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 4, marginTop: 4 },
  key: { flexDirection: "row", alignItems: "center", gap: 6 },
  keyLine: { width: 14, height: 2, borderTopWidth: 2 },
  keyLab: { fontFamily: JP_400, fontSize: 11, color: MUTED },
  chartFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 6,
  },
  footTx: { fontFamily: METRIC_FONT, color: MUTED, fontSize: 10 },
  cmpBlock: { marginBottom: 12 },
  cmpHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 },
  cmpLab: { fontFamily: JP_600, fontSize: 12, color: INK },
  cmpYouN: { fontFamily: BEBAS, fontSize: 22, lineHeight: 24, color: CYAN },
  cmpTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center" },
  cmpYouBar: { height: 8, backgroundColor: CYAN },
  cmpTick: { position: "absolute", top: -3, bottom: -3, width: 2, marginLeft: -1 },
  cmpSub: { fontFamily: JP_400, fontSize: 11, color: MUTED, marginTop: 4 },
  stack: { flexDirection: "row", height: 12, marginBottom: 10 },
  stackRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 32 },
  stackDot: { width: 8, height: 8 },
  stackLab: { width: 88, fontFamily: JP_600, fontSize: 12, color: INK },
  stackPct: { width: 36, textAlign: "right", fontFamily: METRIC_FONT, fontSize: 12, color: CYAN },
  stackPts: { width: 36, textAlign: "right", fontFamily: METRIC_FONT, fontSize: 11, color: GOLD },
  barTrack: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.08)" },
  barFill: { height: 6 },
  teamRow: { flexDirection: "row", alignItems: "center", gap: 6, height: 28 },
  thin: { opacity: 0.42 },
  teamAbbr: { fontFamily: METRIC_FONT, fontSize: 12, width: 34, transform: [{ skewX: "-6deg" }] },
  gCount: { width: 28, fontFamily: METRIC_FONT, fontSize: 10, color: MUTED },
  barTrackTall: { flex: 1, height: 7, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center" },
  barFillTall: { height: 7 },
  baseMark: { position: "absolute", top: -3, bottom: -3, width: 1.5, marginLeft: -0.75, backgroundColor: GOLD },
  teamPct: { width: 36, textAlign: "right", fontFamily: METRIC_FONT, fontSize: 12, color: CYAN, fontVariant: ["tabular-nums"] },
  teamPts: { width: 32, textAlign: "right", fontFamily: METRIC_FONT, fontSize: 11, color: GOLD, fontVariant: ["tabular-nums"] },
  week: { flexDirection: "row", height: 108, gap: 6 },
  weekCol: { flex: 1, alignItems: "center" },
  weekWell: {
    flex: 1,
    width: "70%",
    justifyContent: "flex-end",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(232,198,106,0.2)",
  },
  weekBar: { width: "100%" },
  weekLab: { fontFamily: JP_600, fontSize: 11, color: MUTED, marginTop: 5 },
  weekN: { fontFamily: BEBAS, fontSize: 16, lineHeight: 18, color: INK },
  weekG: { fontFamily: METRIC_FONT, fontSize: 9, color: MUTED },
  hourGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hourCell: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.32)",
    backgroundColor: "rgba(8,8,12,0.55)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  hourHot: { borderColor: GOLD, backgroundColor: "rgba(232,198,106,0.08)" },
  hourLab: { fontFamily: METRIC_FONT, fontSize: 10, color: GOLD, letterSpacing: 0.8 },
  hourVal: { fontFamily: BEBAS, fontSize: 32, lineHeight: 34, color: CYAN, marginTop: 4 },
  hourN: { fontFamily: JP_400, fontSize: 11, color: MUTED, marginTop: 2 },
  sitGrid: { gap: 8 },
  sitCell: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  sitWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CYAN,
  },
  sitLab: { fontFamily: JP_600, fontSize: 12, color: INK },
  sitVal: { fontFamily: BEBAS, fontSize: 32, lineHeight: 34, color: CYAN, marginTop: 2 },
  sitN: { fontFamily: JP_400, fontSize: 11, color: MUTED },
  sitBarTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", marginTop: 8 },
  sitBarFill: { height: 4, backgroundColor: CYAN },
  habitBlock: { marginBottom: 12 },
  habitTracks: { gap: 3 },
  habitTrack: { height: 5, backgroundColor: "rgba(255,255,255,0.08)" },
  habitYouFill: { height: 5, backgroundColor: CYAN },
  habitLgFill: { height: 5, backgroundColor: "rgba(255,255,255,0.28)" },
  h2h: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  h2hCol: { flex: 1 },
  h2hColR: { alignItems: "flex-end" },
  h2hWho: { fontFamily: METRIC_FONT, fontSize: 10, letterSpacing: 1.4, color: CYAN },
  h2hYou: { fontFamily: BEBAS, fontSize: 48, lineHeight: 50, color: CYAN },
  h2hPro: { fontFamily: BEBAS, fontSize: 48, lineHeight: 50, color: GOLD },
  h2hMid: { alignItems: "center", paddingBottom: 8, width: 72 },
  h2hDash: { fontFamily: BEBAS, fontSize: 28, color: "rgba(255,255,255,0.35)" },
  h2hSame: { fontFamily: JP_400, fontSize: 11, color: MUTED, marginTop: 2 },
  h2hCap: { fontFamily: JP_400, fontSize: 11, color: MUTED, marginBottom: 14 },
  vsRow: { marginBottom: 12 },
  vsProFill: { height: 5, backgroundColor: GOLD },
  splitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  splitCell: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(8,8,12,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  splitLab: { fontFamily: JP_600, fontSize: 12, color: INK },
  splitVal: { fontFamily: BEBAS, fontSize: 32, lineHeight: 34, color: CYAN, marginTop: 2 },
  splitBarTrack: { height: 5, backgroundColor: "rgba(255,255,255,0.1)", marginTop: 8, justifyContent: "center" },
  splitYou: { height: 5, backgroundColor: CYAN },
  splitMark: { position: "absolute", top: -3, bottom: -3, width: 1.5, marginLeft: -0.75, backgroundColor: GOLD },
  splitSub: { fontFamily: JP_400, fontSize: 11, color: MUTED, marginTop: 6 },
});
