import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getNbaTeamNicknameById } from "../../../../../../lib/nba-team-names";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import type { NbaLeagueTeamStatRow } from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import {
  LEAGUE_HUB_PLAY_TYPES,
  LEAGUE_HUB_TEAM_CLUTCH,
  LEAGUE_HUB_TEAM_HUSTLE,
  LEAGUE_HUB_TEAM_STRENGTH,
  LEAGUE_HUB_TEAM_THREE,
  leagueHubPlayTypePreset,
  type LeagueHubPlayTypeId,
  type LeagueHubScatterPreset,
  type LeagueHubTeamMetric,
} from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import type {
  LeagueHubRecord,
  LeagueHubTeamRow,
  NbaLeagueHubDoc,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { resolveTeamJerseyPalette } from "../teamColors";
import {
  CYBER_TAB_CYAN,
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { slantedTabWidth } from "./LeagueHubBranchTabsNative";
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import LeagueHubScatterNative, { type HubScatterPoint } from "./LeagueHubScatterNative";
import {
  HubEmpty,
  HubRow,
  HubSection,
  HubTwoCol,
  formatHubValue,
  inkAlpha,
  teamInk,
  formatRecord,
  recordPct,
  teamAbbr,
  teamNameStyle,
  type HubLang,
} from "./leagueHubUiNative";

type Props = {
  hub: NbaLeagueHubDoc | null;
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
};

function nick(teamId: string): string {
  return getNbaTeamNicknameById(teamId).toUpperCase();
}

function metricOf(row: NbaLeagueTeamStatRow, m: LeagueHubTeamMetric): number | null {
  const v = (row as unknown as Record<string, unknown>)[m];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function rankOf(
  rows: NbaLeagueTeamStatRow[],
  teamId: string,
  m: LeagueHubTeamMetric,
  invert?: boolean
): number | null {
  const vals = rows
    .map((r) => ({ id: r.teamId, v: metricOf(r, m) }))
    .filter((x): x is { id: string; v: number } => x.v != null)
    .sort((a, b) => (invert ? a.v - b.v : b.v - a.v));
  const i = vals.findIndex((x) => x.id === teamId);
  return i >= 0 ? i + 1 : null;
}

function withTapHint(hint: string, lang: HubLang): string {
  return `${hint}\n${lang === "ja" ? "ユニフォームをタップで数字を表示。" : "Tap a jersey for numbers."}`;
}

/** 攻撃と守備の 4 要素。invert = 低いほど良い */
const FOUR_FACTORS: readonly {
  side: "OFF" | "DEF";
  items: readonly { metric: LeagueHubTeamMetric; label: string; invert?: boolean }[];
}[] = [
  {
    side: "OFF",
    items: [
      { metric: "efgPct", label: "eFG%" },
      { metric: "tovPct", label: "TOV%", invert: true },
      { metric: "orebPct", label: "OREB%" },
      { metric: "ftaRate", label: "FTr" },
    ],
  },
  {
    side: "DEF",
    items: [
      { metric: "oppEfgPct", label: "eFG%", invert: true },
      { metric: "oppTovPct", label: "TOV%" },
      { metric: "oppOrebPct", label: "OREB%", invert: true },
      { metric: "oppFtaRate", label: "FTr", invert: true },
    ],
  },
];

/** チーム詳細 PERFORMANCE METRICS と同じ: 攻撃 = ホットレッド / 守備 = アイスブルー */
const FF_SIDE = {
  OFF: { label: "OFFENSE", color: "#FF3D5A", glow: "rgba(255,61,90,0.34)" },
  DEF: { label: "DEFENSE", color: "#3BA0FF", glow: "rgba(59,160,255,0.34)" },
} as const;
/** 予想入力・チーム詳細と同じ 6 段（1–5 位 → 6/6 … 26–30 位 → 1/6） */
const RANK_SEGMENTS = 6;

function rankSegPct(rank: number | null, n: number): number {
  if (rank == null || n <= 0) return 0;
  const per = Math.max(1, Math.ceil(n / RANK_SEGMENTS));
  const bucket = Math.min(RANK_SEGMENTS - 1, Math.floor((rank - 1) / per));
  return ((RANK_SEGMENTS - bucket) / RANK_SEGMENTS) * 100;
}

/** 上位 10 = シアン / 下位 10 = オレンジ / 中位 = 白（強さの地図の点線と同じ色） */
function rankInk(rank: number | null, n: number): string {
  if (rank == null) return "rgba(255,255,255,0.4)";
  if (rank <= Math.round(n / 3)) return "#00F5FF";
  if (rank > n - Math.round(n / 3)) return "rgba(255,176,120,0.95)";
  return "rgba(255,255,255,0.7)";
}

/** 強さの地図で選んだチームが、なぜその位置にいるか（4 要素の順位） */
function FourFactors({ rows, teamId }: { rows: NbaLeagueTeamStatRow[]; teamId: string }) {
  const team = rows.find((r) => r.teamId === teamId);
  if (!team) return null;
  const n = rows.length;
  return (
    <View style={styles.ffWrap}>
      {FOUR_FACTORS.map((col) => {
        const side = FF_SIDE[col.side];
        return (
          <View key={col.side} style={styles.ffCol}>
            <View style={styles.ffHead}>
              <View style={[styles.ffHeadMark, { backgroundColor: side.color }]} />
              <Text style={[styles.ffSide, { color: side.color }]}>{side.label}</Text>
              <Text style={styles.ffSub}>4 FACTORS</Text>
            </View>
            {col.items.map((it) => {
              const v = metricOf(team, it.metric);
              const rank = rankOf(rows, teamId, it.metric, it.invert);
              return (
                <View key={it.metric} style={styles.ffRow}>
                  <Text style={styles.ffLabel}>{it.label}</Text>
                  <View style={styles.ffBar}>
                    <CyberSlantedSegBarNative
                      pct={rankSegPct(rank, n)}
                      segments={RANK_SEGMENTS}
                      compact
                      forceStatic
                      accent={{ border: side.color, glow: side.glow, bg: side.color }}
                    />
                  </View>
                  <Text style={styles.ffValue}>{formatHubValue(v, "pct")}</Text>
                  <Text style={[styles.ffRank, { color: rankInk(rank, n) }]}>
                    {rank ? `#${rank}` : "—"}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** 選んだチームのカード。チーム色の枠 + 指標のタイル（+ 強さの地図だけ 4 要素） */
function TeamSelCard({
  rows,
  team,
  preset,
  lang,
  sizeBy,
  fourFactors,
  onDetail,
}: {
  rows: NbaLeagueTeamStatRow[];
  team: NbaLeagueTeamStatRow;
  preset: LeagueHubScatterPreset<LeagueHubTeamMetric>;
  lang: HubLang;
  sizeBy?: LeagueHubTeamMetric;
  fourFactors?: boolean;
  onDetail: () => void;
}) {
  const ink = teamInk(team.teamId);
  const n = rows.length;
  const tiles: { key: string; label: string; value: string; rank: number | null; neutral?: boolean }[] = [
    ...([preset.x, preset.y] as const).map((ax) => ({
      key: ax.metric,
      label: ax.label[lang].replace(/（.*）|\(.*\)/, "").trim(),
      value: formatHubValue(metricOf(team, ax.metric), ax.format),
      rank: rankOf(rows, team.teamId, ax.metric, ax.invert),
    })),
    ...(sizeBy
      ? [
          {
            key: sizeBy,
            label: "PACE",
            value: formatHubValue(metricOf(team, sizeBy), "one"),
            rank: rankOf(rows, team.teamId, sizeBy),
            neutral: true,
          },
        ]
      : []),
  ];
  return (
    <Pressable
      onPress={onDetail}
      style={({ pressed }) => [
        styles.card,
        { borderColor: inkAlpha(ink, 0.75), backgroundColor: inkAlpha(ink, 0.08) },
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={[styles.cardTopBar, { backgroundColor: ink }]} />
      <View style={styles.cardHead}>
        <View style={[styles.cardSquare, { backgroundColor: ink }]} />
        <Text style={[styles.cardName, teamNameStyle]} numberOfLines={1}>
          {nick(team.teamId)}
        </Text>
        <Text style={styles.cardAbbr}>{teamAbbr(team.teamId)}</Text>
        <View style={styles.cardSpacer} />
        <Text style={styles.cardGo}>DETAIL ›</Text>
      </View>
      <View style={styles.tiles}>
        {tiles.map((t) => (
          <View key={t.key} style={styles.tile}>
            <Text style={styles.tileLabel} numberOfLines={1}>
              {t.label}
            </Text>
            <View style={styles.tileValueRow}>
              <Text style={styles.tileValue}>{t.value}</Text>
              <Text
                style={[
                  styles.tileRank,
                  { color: t.neutral ? "rgba(255,255,255,0.55)" : rankInk(t.rank, n) },
                ]}
              >
                {t.rank ? `#${t.rank}` : ""}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {fourFactors ? <FourFactors rows={rows} teamId={team.teamId} /> : null}
    </Pressable>
  );
}

function TeamScatterBlock({
  rows,
  preset,
  lang,
  sizeBy,
  onSelectTeam,
  watermarks,
  bleedPastScreen = true,
  fourFactors,
}: {
  rows: NbaLeagueTeamStatRow[];
  preset: LeagueHubScatterPreset<LeagueHubTeamMetric>;
  lang: HubLang;
  sizeBy?: LeagueHubTeamMetric;
  onSelectTeam: (teamId: string) => void;
  watermarks?: { tl?: string; br?: string };
  bleedPastScreen?: boolean;
  /** 選んだチームの下に攻守 4 要素の順位を出す */
  fourFactors?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setSelected(null);
  }, [preset.id]);
  const points = useMemo(() => {
    const sizeVals = sizeBy
      ? rows.map((r) => metricOf(r, sizeBy)).filter((v): v is number => v != null)
      : [];
    const sMin = Math.min(...sizeVals);
    const sMax = Math.max(...sizeVals);
    const out: HubScatterPoint[] = [];
    for (const r of rows) {
      const x = metricOf(r, preset.x.metric);
      const y = metricOf(r, preset.y.metric);
      if (x == null || y == null) continue;
      const pal = resolveTeamJerseyPalette("nba", { teamId: r.teamId }, "#00F5FF");
      const s = sizeBy ? metricOf(r, sizeBy) : null;
      out.push({
        id: r.teamId,
        x,
        y,
        label: teamAbbr(r.teamId),
        color: pal.primary,
        secondary: pal.secondary,
        scale: s != null && sMax > sMin ? (s - sMin) / (sMax - sMin) : 0.4,
      });
    }
    return out;
  }, [rows, preset, sizeBy]);

  if (points.length < 3) {
    return <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />;
  }
  const sel = selected ? rows.find((r) => r.teamId === selected) : null;

  return (
    <View>
      <LeagueHubScatterNative
        points={points}
        xAxis={preset.x}
        yAxis={preset.y}
        quadrants={preset.quadrants}
        lang={lang}
        marker="jersey"
        selectedId={selected}
        onSelect={setSelected}
        watermarks={watermarks ?? preset.marks}
        bleedPastScreen={bleedPastScreen}
      />
      {sel ? (
        <TeamSelCard
          rows={rows}
          team={sel}
          preset={preset}
          lang={lang}
          sizeBy={sizeBy}
          fourFactors={fourFactors}
          onDetail={() => onSelectTeam(sel.teamId)}
        />
      ) : null}
    </View>
  );
}

const MIX_SEGMENTS = [
  { id: "three", label: "3P", color: "#00F5FF" },
  { id: "paint", label: "PAINT", color: "#FF4FD8" },
  { id: "mid", label: "MID", color: "#FFD166" },
  { id: "ft", label: "FT", color: "rgba(255,255,255,0.55)" },
] as const;
type MixId = (typeof MIX_SEGMENTS)[number]["id"];

function scoringMix(r: NbaLeagueTeamStatRow): Record<MixId, number> {
  const three = r.pctPts3 || 0;
  const paint = r.pctPtsPaint || 0;
  const ft = r.pctPtsFt || 0;
  return { three, paint, ft, mid: Math.max(0, 1 - three - paint - ft) };
}

function ScoringMix({
  rows,
  lang,
  onSelectTeam,
}: {
  rows: NbaLeagueTeamStatRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [sortBy, setSortBy] = useState<MixId>("three");
  const sorted = useMemo(
    () =>
      rows
        .filter((r) => (r.pctPts3 || 0) + (r.pctPtsPaint || 0) > 0)
        .map((r) => ({ r, mix: scoringMix(r) }))
        .sort((a, b) => b.mix[sortBy] - a.mix[sortBy]),
    [rows, sortBy]
  );
  if (sorted.length === 0) {
    return <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />;
  }
  return (
    <View>
      <CyberSlantedTabBarNative fill>
        {MIX_SEGMENTS.map((s) => {
          const label = `BY ${s.label}`;
          const active = sortBy === s.id;
          return (
            <CyberSlantedTabNative
              key={s.id}
              label={label}
              active={active}
              onPress={() => setSortBy(s.id)}
              compact
              fontWeight="700"
              theme={{
                accent: s.color,
                inactiveText: s.color,
                inactiveBorder: s.color,
                activeText: "#050508",
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            />
          );
        })}
      </CyberSlantedTabBarNative>
      <View style={styles.legend}>
        {MIX_SEGMENTS.map((s) => (
          <View key={s.id} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>
      {sorted.map(({ r, mix }) => (
        <Pressable key={r.teamId} style={styles.mixRow} onPress={() => onSelectTeam(r.teamId)}>
          <Text style={styles.mixAbbr}>{teamAbbr(r.teamId)}</Text>
          <View style={styles.mixBar}>
            {MIX_SEGMENTS.map((s) => (
              <View
                key={s.id}
                style={{
                  flex: mix[s.id],
                  backgroundColor: s.color,
                  opacity: s.id === sortBy ? 1 : 0.55,
                }}
              />
            ))}
          </View>
          <Text style={styles.mixValue}>{formatHubValue(mix[sortBy], "pct")}</Text>
        </Pressable>
      ))}
    </View>
  );
}


type StyleMode = "play" | "three" | "hustle" | "clutch";

const STYLE_MODES: readonly { id: StyleMode; label: string }[] = [
  { id: "play", label: "PLAY TYPE" },
  { id: "three", label: "3PT" },
  { id: "hustle", label: "HUSTLE" },
  { id: "clutch", label: "CLUTCH" },
];

/** プレータイプ・ハッスル・クラッチは同じジャージの散布図なので 1 枚で切り替える（背景は消さない） */
function StyleMaps({
  rows,
  lang,
  onSelectTeam,
}: {
  rows: NbaLeagueTeamStatRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [mode, setMode] = useState<StyleMode>("play");
  const [pt, setPt] = useState<LeagueHubPlayTypeId>("pnrBh");
  const preset = useMemo(() => {
    if (mode === "three") return LEAGUE_HUB_TEAM_THREE;
    if (mode === "hustle") return LEAGUE_HUB_TEAM_HUSTLE;
    if (mode === "clutch") return LEAGUE_HUB_TEAM_CLUTCH;
    return leagueHubPlayTypePreset(pt);
  }, [mode, pt]);
  return (
    <HubSection title="PLAY STYLE" hint={withTapHint(preset.hint[lang], lang)}>
      <SlantedTabs items={STYLE_MODES} value={mode} onChange={setMode} />
      {mode === "play" ? (
        <ScrollSlantedTabs
          items={LEAGUE_HUB_PLAY_TYPES.map((p) => ({ id: p.id, label: p.short }))}
          value={pt}
          onChange={setPt}
        />
      ) : null}
      <TeamScatterBlock rows={rows} preset={preset} lang={lang} onSelectTeam={onSelectTeam} />
    </HubSection>
  );
}

/** 斜めタブを横スクロールで並べる（1 行に収まらない数のとき） */
function ScrollSlantedTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.playTypeScroll}
      contentContainerStyle={styles.playTypeScrollContent}
    >
      {items.map((it) => {
        const active = value === it.id;
        return (
          <View key={it.id} style={[styles.playTypeSlot, { width: slantedTabWidth(it.label) }]}>
            <CyberSlantedTabNative
              label={it.label}
              active={active}
              onPress={() => onChange(it.id)}
              compact
              fill
              fontWeight="700"
              glow="tight"
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

type RecordMode = "streak" | ConditionId;

const RECORD_MODES: readonly { id: RecordMode; label: string }[] = [
  { id: "streak", label: "STREAK" },
  { id: "close", label: "CLOSE ≤5" },
  { id: "b2b", label: "B2B" },
  { id: "vsOver500", label: "VS .500+" },
  { id: "home", label: "HOME" },
  { id: "away", label: "AWAY" },
];

/** 連勝・連敗と状況別の勝敗は同じ「上位 5 / 下位 5」の 2 列なので 1 つの欄で切り替える */
function TeamRecords({
  teams,
  lang,
  onSelectTeam,
}: {
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [mode, setMode] = useState<RecordMode>("streak");
  const ja = lang === "ja";
  const hint =
    mode === "streak"
      ? ja
        ? "いま続いている連勝・連敗。L10 は直近 10 試合の成績。"
        : "Current win and losing streaks. L10 = last 10 games."
      : ja
        ? "2 試合以上あるチームだけ。"
        : "Teams with 2+ games only.";
  return (
    <HubSection title="FORM & SPLITS" hint={hint}>
      <ScrollSlantedTabs items={RECORD_MODES} value={mode} onChange={setMode} />
      {mode === "streak" ? (
        <TeamForm teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      ) : (
        <Conditions cond={mode} teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      )}
    </HubSection>
  );
}

function TeamForm({
  teams,
  lang,
  onSelectTeam,
}: {
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const by = (kind: "W" | "L") =>
    teams
      .filter((t) => t.streak?.kind === kind)
      .sort(
        (a, b) =>
          (b.streak?.count ?? 0) - (a.streak?.count ?? 0) ||
          (kind === "W" ? (recordPct(b.last10) ?? 0) - (recordPct(a.last10) ?? 0) : (recordPct(a.last10) ?? 0) - (recordPct(b.last10) ?? 0))
      )
      .slice(0, 5);
  const list = (rows: LeagueHubTeamRow[]) =>
    rows.length === 0 ? (
      <HubEmpty text="—" />
    ) : (
      rows.map((t) => (
        <HubRow
          key={t.teamId}
          teamId={t.teamId}
          name={nick(t.teamId)}
          kind="team"
          value={`${t.streak!.kind}${t.streak!.count}`}
          valueSub={`L10 ${formatRecord(t.last10)}`}
          onPress={() => onSelectTeam(t.teamId)}
          framed
        />
      ))
    );
  return (
    <HubTwoCol
      leftTitle="WIN STREAKS"
      rightTitle="LOSING STREAKS"
      left={list(by("W"))}
      right={list(by("L"))}
    />
  );
}

function PositionDefense({
  teams,
  lang,
  onSelectTeam,
}: {
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [pos, setPos] = useState<"G" | "F" | "C">("G");
  const rows = teams
    .map((t) => ({ t, cell: t.posDef?.[pos] ?? null }))
    .filter((x): x is { t: LeagueHubTeamRow; cell: { pts: number; rank: number } } => x.cell != null)
    .sort((a, b) => a.cell.rank - b.cell.rank);
  if (rows.length === 0) {
    return <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />;
  }
  const list = (xs: typeof rows) =>
    xs.map(({ t, cell }) => (
      <HubRow
        key={t.teamId}
        rank={cell.rank}
        teamId={t.teamId}
        name={nick(t.teamId)}
        kind="team"
        value={cell.pts.toFixed(1)}
        onPress={() => onSelectTeam(t.teamId)}
        framed
      />
    ));
  return (
    <View>
      <SlantedTabs
        items={[
          { id: "G", label: "GUARDS" },
          { id: "F", label: "FORWARDS" },
          { id: "C", label: "CENTERS" },
        ]}
        value={pos}
        onChange={setPos}
      />
      <HubTwoCol
        leftTitle="STINGIEST"
        rightTitle="LEAKIEST"
        left={list(rows.slice(0, 5))}
        right={list(rows.slice(-5).reverse())}
      />
    </View>
  );
}

type ConditionId = "b2b" | "close" | "vsOver500" | "home" | "away";

function Conditions({
  cond,
  teams,
  lang,
  onSelectTeam,
}: {
  cond: ConditionId;
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const rows = teams
    .map((t) => ({ t, rec: t[cond] as LeagueHubRecord | null }))
    .filter(
      (x): x is { t: LeagueHubTeamRow; rec: LeagueHubRecord } =>
        x.rec != null && x.rec.wins + x.rec.losses >= 2
    )
    .map((x) => ({ ...x, pct: recordPct(x.rec) ?? 0 }));
  if (rows.length === 0) {
    return <HubEmpty text={lang === "ja" ? "まだ試合が少ないです" : "Not enough games yet"} />;
  }
  const best = [...rows].sort((a, b) => b.pct - a.pct || b.rec.wins - a.rec.wins).slice(0, 5);
  const worst = [...rows].sort((a, b) => a.pct - b.pct || b.rec.losses - a.rec.losses).slice(0, 5);
  const list = (xs: typeof rows) =>
    xs.map(({ t, rec, pct }) => (
      <HubRow
        key={t.teamId}
        teamId={t.teamId}
        name={nick(t.teamId)}
        kind="team"
        value={formatRecord(rec)}
        valueSub={pct.toFixed(3).replace(/^0/, "")}
        onPress={() => onSelectTeam(t.teamId)}
        framed
      />
    ));
  return (
    <HubTwoCol
      leftTitle="BEST"
      rightTitle="WORST"
      left={list(best)}
      right={list(worst)}
    />
  );
}

/** 他の切り替えと同じ斜めタブを横いっぱいに並べる */
function SlantedTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <CyberSlantedTabBarNative fill>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <CyberSlantedTabNative
            key={it.id}
            label={it.label}
            active={active}
            onPress={() => onChange(it.id)}
            compact
            fontWeight="700"
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          />
        );
      })}
    </CyberSlantedTabBarNative>
  );
}

export default function LeagueHubTeamPanelNative({ hub, lang, onSelectTeam }: Props) {
  const { bundle, loading } = useLeagueTeamStatsBundle({
    apiBaseUrl: getUniterzApiBaseUrl(),
    season: CURRENT_NBA_SEASON_KEY,
  });
  const rows = bundle.season;
  const teams = hub?.teams ?? [];

  if (loading && rows.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={CYBER_TAB_CYAN} />
      </View>
    );
  }

  return (
    <View>
      <HubSection
        title={LEAGUE_HUB_TEAM_STRENGTH.label.en}
        hint={`${withTapHint(LEAGUE_HUB_TEAM_STRENGTH.hint[lang], lang)}\n${
          lang === "ja"
            ? "選ぶと攻守の 4 要素（シュート効率 eFG%・ミスの少なさ TOV%・オフェンスリバウンド OREB%・フリースロー獲得 FTr）の順位も出る。"
            : "Pick a team to see its four factors on both ends (eFG%, TOV%, OREB%, FTr)."
        }`}
      >
        <TeamScatterBlock
          rows={rows}
          preset={LEAGUE_HUB_TEAM_STRENGTH}
          lang={lang}
          sizeBy="pace"
          onSelectTeam={onSelectTeam}
          bleedPastScreen
          fourFactors
        />
      </HubSection>

      <HubSection
        title="SCORING MIX"
        hint={
          lang === "ja"
            ? "得点のうち 3P・ペイント・ミドル・フリースローが占める割合。"
            : "Share of points from 3s, the paint, mid-range and free throws."
        }
      >
        <ScoringMix rows={rows} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <StyleMaps rows={rows} lang={lang} onSelectTeam={onSelectTeam} />

      <TeamRecords teams={teams} lang={lang} onSelectTeam={onSelectTeam} />

      <HubSection
        title="POINTS ALLOWED BY POSITION"
        hint={
          lang === "ja"
            ? "相手のガード・フォワード・センターに 1 試合で取られた得点。"
            : "Points per game allowed to opposing guards, forwards and centers."
        }
      >
        <PositionDefense teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  card: {
    marginTop: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTopBar: {
    height: 2,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  cardSquare: {
    width: 10,
    height: 10,
  },
  cardName: {
    color: "#fff",
    fontSize: 17,
    flexShrink: 1,
  },
  cardAbbr: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  cardSpacer: {
    flex: 1,
  },
  cardGo: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tiles: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: "rgba(5,5,8,0.45)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tileLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  tileValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginTop: 2,
  },
  tileValue: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  tileRank: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
  },
  ffWrap: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(5,5,8,0.3)",
  },
  ffCol: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  ffHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  ffHeadMark: {
    width: 6,
    height: 6,
    transform: [{ skewX: "-14deg" }],
  },
  ffSide: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  ffSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  ffRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ffLabel: {
    width: 36,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "700",
  },
  ffBar: {
    flex: 1,
    minWidth: 0,
  },
  ffValue: {
    width: 40,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  ffRank: {
    width: 24,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
  },
  playTypeScroll: {
    height: 54,
    marginHorizontal: -12,
  },
  playTypeScrollContent: {
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  playTypeSlot: {
    height: 30,
  },
  legend: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
  },
  legendText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "700",
  },
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 18,
    marginBottom: 3,
  },
  mixAbbr: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "800",
    width: 30,
  },
  mixBar: {
    flex: 1,
    height: 12,
    flexDirection: "row",
    overflow: "hidden",
  },
  mixValue: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    width: 44,
    textAlign: "right",
  },
});
