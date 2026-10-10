/** Web `NbaDisciplineSection` 相当 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import type {
  NbaDisciplineDetailSlice,
  NbaDisciplineHistoryPoint,
  NbaDisciplineSeasonType,
} from "../../../../../lib/nba/discipline/disciplineTypes";
import {
  buildDisciplineCells,
  disciplineFineLines,
  disciplineFinePartRows,
  disciplineSourceLine,
  disciplineHasPlayoffs,
  disciplineHasRecords,
  disciplinePlayerRows,
  disciplineSectionCopy,
  NBA_DISCIPLINE_COLLAPSED_ROWS,
  NBA_DISCIPLINE_HOT_RANK,
  NBA_DISCIPLINE_SECTION_TITLE,
  type NbaDisciplineCell,
} from "../../../../../lib/nba/discipline/disciplineDetailCells";
import {
  useNbaPlayerDisciplineSeason,
  useNbaTeamDisciplineSeason,
} from "../../../../../lib/nba/discipline/useNbaTeamDisciplineSeason";
import type { Language } from "../../../../../lib/i18n/language";
import {
  buildDisciplineTrend,
  NBA_DISCIPLINE_TREND_METRICS,
  type NbaDisciplineTrendMetric,
} from "../../../../../lib/nba/discipline/disciplineTrend";
import { formatDisciplineFineUsd } from "../../../../../lib/nba/discipline/formatDisciplineFineUsd";
import { useNbaDisciplineHistory } from "../../../../../lib/nba/discipline/useNbaDisciplineHistory";
import ResultDetailScoreDonutNative from "../results/ResultDetailScoreDonutNative";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";
import NbaLeagueStatsSeasonNavNative from "./NbaLeagueStatsSeasonNavNative";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

/** アプリ日本語の基準フォント（Web `jp`）。Oxanium は和文グリフを持たない */
const JA_LABEL_FONT = "NotoSansJP_700Bold";
const JA_BODY_FONT = "NotoSansJP_400Regular";

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
  ja,
}: {
  cells: NbaDisciplineCell[];
  accent: string;
  leagueLabel: string;
  ja: boolean;
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
            <Text style={[styles.cellRank, ja ? styles.jaLabel : null, hot ? { color: accent } : null]}>
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

const TREND_HEIGHT = 128;
const TREND_PAD = { padX: 18, padTop: 20, padBottom: 20 };

/** Web `TrendChart` 相当 */
function TrendChartNative({
  points,
  phase,
  accent,
  selectedSeason,
  onSelectSeason,
  copy,
  ja,
}: {
  points: NbaDisciplineHistoryPoint[];
  phase: NbaDisciplineSeasonType;
  accent: string;
  selectedSeason: string | null;
  onSelectSeason?: (season: string) => void;
  copy: Copy;
  ja: boolean;
}) {
  const [metric, setMetric] = useState<NbaDisciplineTrendMetric>("tech");
  const [width, setWidth] = useState(0);
  const trend =
    width > 0
      ? buildDisciplineTrend(points, phase, metric, {
          width,
          height: TREND_HEIGHT,
          ...TREND_PAD,
        })
      : null;
  const total = buildDisciplineTrend(points, phase, metric, {
    width: 1,
    height: 1,
    padX: 0,
    padTop: 0,
    padBottom: 0,
  }).total;
  return (
    <View style={styles.block}>
      <View style={styles.trendHead}>
        <Text style={[styles.subLabel, ja ? styles.jaLabel : null]}>{copy.trend}</Text>
        <Text style={styles.trendTotal}>
          <Text style={[styles.subLabel, ja ? styles.jaLabel : null]}>{copy.trendTotal} </Text>
          {total}
        </Text>
      </View>
      <View style={[styles.box, styles.trendBox, { borderColor: hexToRgba(accent, 0.3) }]}>
        <View style={styles.metricRow}>
          {NBA_DISCIPLINE_TREND_METRICS.map((m) => {
            const on = m.key === metric;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMetric(m.key)}
                hitSlop={6}
                style={[styles.phaseBtn, { borderBottomColor: on ? accent : "transparent" }]}
              >
                <Text style={[styles.metricText, on ? styles.phaseTextOn : null]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View
          style={{ height: TREND_HEIGHT }}
          onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
        >
          {trend ? (
            <Svg width={width} height={TREND_HEIGHT}>
              <Defs>
                <LinearGradient id="disciplineTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={accent} stopOpacity={0.32} />
                  <Stop offset="1" stopColor={accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Line
                x1={0}
                x2={width}
                y1={trend.baselineY}
                y2={trend.baselineY}
                stroke={hexToRgba(accent, 0.2)}
                strokeWidth={1}
              />
              {trend.area ? <Path d={trend.area} fill="url(#disciplineTrendFill)" /> : null}
              <Path
                d={trend.line}
                fill="none"
                stroke={hexToRgba(accent, 0.35)}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={trend.line}
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trend.dots.map((d) => {
                const on = d.season === selectedSeason;
                return (
                  <G key={d.season} onPress={onSelectSeason ? () => onSelectSeason(d.season) : undefined}>
                    <Circle cx={d.x} cy={d.y} r={14} fill="transparent" />
                    <Circle
                      cx={d.x}
                      cy={d.y}
                      r={on ? 4.5 : 3}
                      fill={on ? accent : "#050508"}
                      stroke={accent}
                      strokeWidth={1.5}
                    />
                    <SvgText
                      x={d.x}
                      y={d.y - 8}
                      textAnchor="middle"
                      fontFamily={METRIC_FONT}
                      fontSize={9}
                      fontWeight="700"
                      fill={on ? "#FFFFFF" : "rgba(255,255,255,0.55)"}
                    >
                      {d.display}
                    </SvgText>
                    <SvgText
                      x={d.x}
                      y={TREND_HEIGHT - 5}
                      textAnchor="middle"
                      fontFamily={METRIC_FONT}
                      fontSize={8.5}
                      fontWeight="700"
                      fill={on ? accent : "rgba(255,255,255,0.35)"}
                    >
                      {d.label}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Web `FineBreakdown` 相当 */
function FineBreakdownNative({
  rows,
  total,
  accent,
  copy,
  ja,
  bodyLang,
}: {
  rows: ReturnType<typeof disciplineFinePartRows>;
  total: number;
  accent: string;
  copy: Copy;
  ja: boolean;
  bodyLang: Language;
}) {
  return (
    <View style={styles.block}>
      <Text style={[styles.subLabel, ja ? styles.jaLabel : null]}>{copy.fineBreakdown}</Text>
      <View style={[styles.box, styles.breakdownBox, { borderColor: hexToRgba(accent, 0.3) }]}>
        <ResultDetailScoreDonutNative
          segments={rows.map((r) => ({ value: r.value, color: r.color }))}
          total={total}
          totalDisplay={formatDisciplineFineUsd(total)}
          totalLabel="FINES"
          size={88}
          thickness={12}
        />
        <View style={styles.breakdownRows}>
          {rows.map((r) => (
            <View key={r.key} style={styles.breakdownRow}>
              <View style={[styles.breakdownSwatch, { backgroundColor: r.color }]} />
              <Text
                style={[styles.breakdownLabel, bodyLang === "ja" ? styles.jaLabel : null]}
              >
                {r.label}
              </Text>
              <View style={styles.breakdownValue}>
                <Text style={styles.breakdownAmount}>{r.amount}</Text>
                <Text style={styles.breakdownPct}>{r.pct}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ExpandButton({
  expanded,
  total,
  onToggle,
  accent,
  copy,
  ja,
}: {
  expanded: boolean;
  total: number;
  onToggle: () => void;
  accent: string;
  copy: Copy;
  ja: boolean;
}) {
  if (total <= NBA_DISCIPLINE_COLLAPSED_ROWS) return null;
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.expand, { borderTopColor: hexToRgba(accent, 0.2) }]}
    >
      <Text style={[styles.expandText, ja ? styles.jaLabel : null, { color: accent }]}>
        {expanded ? copy.showLess : copy.showAll(total)}
      </Text>
    </Pressable>
  );
}

export function NbaDisciplineSectionNative({
  slice,
  accent,
  isJa,
  lang,
  showPlayerNames = false,
  onPlayerPress,
  trend,
  season,
}: {
  slice: NbaDisciplineDetailSlice | null;
  accent: string;
  isJa: boolean;
  lang?: Language;
  showPlayerNames?: boolean;
  onPlayerPress?: (playerId: string) => void;
  /** シーズン推移（undefined = 出さない / null = 読み込み中） */
  trend?: NbaDisciplineHistoryPoint[] | null;
  season?: {
    seasonKey: string;
    seasonKeys: readonly string[];
    onChange: (seasonKey: string) => void;
    loading: boolean;
  };
}) {
  const copy = disciplineSectionCopy(isJa);
  const bodyLang: Language = lang ?? (isJa ? "ja" : "en");
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
  const fines = slice ? disciplineFineLines(slice, activePhase, bodyLang) : [];
  const fineParts = slice ? disciplineFinePartRows(slice, activePhase, bodyLang) : [];
  const trendPoints = trend && trend.length > 1 ? trend : null;
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
        <Text style={[styles.empty, isJa ? styles.jaBody : null]}>
          {season?.loading ? copy.loading : copy.empty}
        </Text>
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

          <CellRow cells={cells} accent={accent} leagueLabel={copy.league} ja={isJa} />

          {empty ? (
            <Text style={[styles.empty, isJa ? styles.jaBody : null]}>{copy.empty}</Text>
          ) : null}

          {fineParts.length > 0 ? (
            <FineBreakdownNative
              rows={fineParts}
              total={slice[activePhase].fines}
              accent={accent}
              copy={copy}
              ja={isJa}
              bodyLang={bodyLang}
            />
          ) : null}

          {shownPlayers.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.subLabel, isJa ? styles.jaLabel : null]}>{copy.players}</Text>
              <View style={[styles.box, boxBorder]}>
                <View style={styles.tableRow}>
                  <Text style={[styles.th, styles.colName, isJa ? styles.jaLabel : null]}>
                    {copy.player}
                  </Text>
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
                    <View style={styles.colName}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {r.name}
                      </Text>
                    </View>
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
                  ja={isJa}
                />
              </View>
            </View>
          ) : null}

          {shownFines.length > 0 ? (
            <View style={styles.block}>
              <Text style={[styles.subLabel, isJa ? styles.jaLabel : null]}>
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
                          bodyLang === "ja" ? styles.jaBody : null,
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
                  ja={isJa}
                />
              </View>
            </View>
          ) : null}
        </>
      )}

      {trendPoints ? (
        <TrendChartNative
          points={trendPoints}
          phase={activePhase}
          accent={accent}
          selectedSeason={season?.seasonKey ?? slice?.season ?? null}
          onSelectSeason={season?.onChange}
          copy={copy}
          ja={isJa}
        />
      ) : null}

      <Text style={[styles.note, isJa ? styles.jaBody : null]}>{copy.note}</Text>
      <Text style={[styles.source, bodyLang === "ja" ? styles.jaBody : null]}>
        {disciplineSourceLine(bodyLang, slice?.updatedAtMs)}
      </Text>
    </View>
  );
}

/** Web `NbaTeamDisciplineSection` 相当（年切替付き） */
export function NbaTeamDisciplineSectionNative({
  teamId,
  initial,
  accent,
  isJa,
  lang,
  onPlayerPress,
}: {
  teamId: string;
  initial: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  lang?: Language;
  onPlayerPress?: (playerId: string) => void;
}) {
  const s = useNbaTeamDisciplineSeason({
    teamId,
    initial,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const trend = useNbaDisciplineHistory({
    subject: "team",
    id: teamId,
    toSeason: initial.season,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  return (
    <NbaDisciplineSectionNative
      slice={s.slice}
      accent={accent}
      isJa={isJa}
      lang={lang}
      showPlayerNames
      onPlayerPress={onPlayerPress}
      trend={trend}
      season={{
        seasonKey: s.seasonKey,
        seasonKeys: s.seasonKeys,
        onChange: s.setSeasonKey,
        loading: s.loading,
      }}
    />
  );
}

/** Web `NbaPlayerDisciplineSection` 相当 */
export function NbaPlayerDisciplineSectionNative({
  playerId,
  initial,
  accent,
  isJa,
  lang,
}: {
  playerId: string;
  initial: NbaDisciplineDetailSlice;
  accent: string;
  isJa: boolean;
  lang?: Language;
}) {
  const s = useNbaPlayerDisciplineSeason({
    playerId,
    initial,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const trend = useNbaDisciplineHistory({
    subject: "player",
    id: playerId,
    toSeason: initial.season,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  return (
    <NbaDisciplineSectionNative
      slice={s.slice}
      accent={accent}
      isJa={isJa}
      lang={lang}
      trend={trend}
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
  playerName: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    transform: [{ skewX: "-8deg" }],
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
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    transform: [{ skewX: "-8deg" }],
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
  jaLabel: {
    fontFamily: JA_LABEL_FONT,
    letterSpacing: 0.4,
  },
  jaBody: {
    fontFamily: JA_BODY_FONT,
  },
  note: {
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.35)",
  },
  source: {
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
  },
  trendHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  trendTotal: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  trendBox: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  metricRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 4,
  },
  metricText: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  breakdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  breakdownRows: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  breakdownSwatch: {
    width: 10,
    height: 10,
    marginTop: 3,
  },
  breakdownLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    color: "#F1F5F9",
  },
  breakdownValue: {
    alignItems: "flex-end",
  },
  breakdownAmount: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  breakdownPct: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    fontVariant: ["tabular-nums"],
  },
});
