import { Fragment, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { getNbaTeamNicknameById } from "../../../../../../lib/nba-team-names";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import type { NbaLeagueTeamStatRow } from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import {
  LEAGUE_HUB_PLAY_TYPES,
  LEAGUE_HUB_TEAM_ACE,
  LEAGUE_HUB_TEAM_AGE,
  LEAGUE_HUB_TEAM_ATTACK,
  LEAGUE_HUB_TEAM_BENCH,
  LEAGUE_HUB_TEAM_CLUTCH,
  LEAGUE_HUB_TEAM_CONTEST,
  LEAGUE_HUB_TEAM_PASS_VALUE,
  LEAGUE_HUB_TEAM_DRIVE_FINISH,
  LEAGUE_HUB_TEAM_SCREEN,
  LEAGUE_HUB_TEAM_SHOT_ALLOW,
  LEAGUE_HUB_TEAM_DEPTH,
  LEAGUE_HUB_TEAM_HUSTLE,
  LEAGUE_HUB_TEAM_PAYROLL,
  LEAGUE_HUB_TEAM_REBOUND,
  LEAGUE_HUB_TEAM_SHOT_CREATION,
  LEAGUE_HUB_TEAM_SHOT_DEFENSE,
  LEAGUE_HUB_TEAM_SIZE,
  LEAGUE_HUB_TEAM_STRENGTH,
  LEAGUE_HUB_TEAM_TEMPO,
  LEAGUE_HUB_TEAM_THREE,
  LEAGUE_HUB_TEAM_TURNOVER,
  leagueHubPlayTypePreset,
  type LeagueHubPlayTypeId,
  type LeagueHubScatterPreset,
  type LeagueHubTeamMetric,
} from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import type {
  LeagueHubPosDefStat,
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
import { CyberSlantedSegBarNative } from "../../rankings/CyberSlantedSegBarNative";
import LeagueHubScatterNative, { type HubScatterPoint } from "./LeagueHubScatterNative";
import { HubScrollSlantedTabs, HubSlantedTabs } from "./LeagueHubSlantedTabsNative";
import {
  HUB_BAD_COLOR,
  HUB_GOOD_COLOR,
  HubAvgDivider,
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

export type LeagueHubTeamSection = "style" | "scoring" | "form" | "defense";

export const LEAGUE_HUB_TEAM_SECTIONS: readonly { id: LeagueHubTeamSection; label: string }[] = [
  { id: "style", label: "STYLE" },
  { id: "scoring", label: "SCORING" },
  { id: "form", label: "FORM" },
  { id: "defense", label: "DEFENSE" },
];

type Props = {
  hub: NbaLeagueHubDoc | null;
  lang: HubLang;
  section: LeagueHubTeamSection;
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
        marker="square"
        showRange
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
      ) : (
        <Text style={styles.tapHint}>
          {lang === "ja" ? "四角をタップでチームの数字を表示" : "Tap a square to see the team"}
        </Text>
      )}
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
type MixSide = "scored" | "allowed";

const MIX_SIDES: readonly { id: MixSide; label: string }[] = [
  { id: "scored", label: "SCORED" },
  { id: "allowed", label: "ALLOWED" },
];

function scoringMix(r: NbaLeagueTeamStatRow, side: MixSide): Record<MixId, number> {
  const allowed = side === "allowed";
  const three = (allowed ? r.oppPctPts3 : r.pctPts3) || 0;
  const paint = (allowed ? r.oppPctPtsPaint : r.pctPtsPaint) || 0;
  const ft = (allowed ? r.oppPctPtsFt : r.pctPtsFt) || 0;
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
  const [side, setSide] = useState<MixSide>("scored");
  const [sortBy, setSortBy] = useState<MixId>("three");
  const sorted = useMemo(
    () =>
      rows
        .map((r) => ({ r, mix: scoringMix(r, side) }))
        .filter(({ mix }) => mix.three + mix.paint > 0)
        .sort((a, b) => b.mix[sortBy] - a.mix[sortBy]),
    [rows, sortBy, side]
  );
  /** 選んだ項目を左端に置いて、どのタブでも長さで比べられるようにする */
  const segments = useMemo(
    () => [...MIX_SEGMENTS].sort((a, b) => Number(b.id === sortBy) - Number(a.id === sortBy)),
    [sortBy]
  );
  const avg =
    sorted.length > 0 ? sorted.reduce((a, x) => a + x.mix[sortBy], 0) / sorted.length : 0;
  const sortColor = MIX_SEGMENTS.find((s) => s.id === sortBy)!.color;
  const sideTabs = <HubSlantedTabs items={MIX_SIDES} value={side} onChange={setSide} />;
  if (sorted.length === 0) {
    return (
      <View>
        {sideTabs}
        <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />
      </View>
    );
  }
  return (
    <View>
      {sideTabs}
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
      <Text style={styles.mapHint}>
        {side === "allowed"
          ? lang === "ja"
            ? "取られた点のうち 3P・ペイント・ミドル・フリースローが占める割合。上ほどそこから多く取られている。縦線はリーグ平均。"
            : "Share of points allowed from 3s, the paint, mid-range and free throws. Higher = gives up more from there. The line is the league average."
          : lang === "ja"
            ? "得点のうち 3P・ペイント・ミドル・フリースローが占める割合。タブで並べ替え、縦線はリーグ平均。"
            : "Share of points from 3s, the paint, mid-range and free throws. Tap a tab to sort; the line is the league average."}
      </Text>
      <View style={styles.legend}>
        {MIX_SEGMENTS.map((s) => (
          <View key={s.id} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
        <View style={styles.legendSpacer} />
        <Text style={[styles.legendText, { color: sortColor }]}>
          AVG {formatHubValue(avg, "pct")}
        </Text>
      </View>
      {sorted.map(({ r, mix }, i) => (
        <Pressable key={r.teamId} style={styles.mixRow} onPress={() => onSelectTeam(r.teamId)}>
          <Text style={styles.mixRank}>{i + 1}</Text>
          <Text style={styles.mixAbbr}>{teamAbbr(r.teamId)}</Text>
          <View style={styles.mixBar}>
            {segments.map((s) => (
              <View
                key={s.id}
                style={{
                  flex: mix[s.id],
                  backgroundColor: s.color,
                  opacity: s.id === sortBy ? 1 : 0.55,
                }}
              />
            ))}
            <View style={[styles.mixAvg, { left: `${avg * 100}%` }]} />
          </View>
          <Text style={styles.mixValue}>{formatHubValue(mix[sortBy], "pct")}</Text>
        </Pressable>
      ))}
    </View>
  );
}


type StylePresetId =
  | "strength"
  | "clutch"
  | "three"
  | "attack"
  | "shotCreation"
  | "tempo"
  | "shotDefense"
  | "hustle"
  | "contestSplit"
  | "passValue"
  | "driveFinish"
  | "screen"
  | "shotAllow"
  | "rebound"
  | "turnover"
  | "ace"
  | "depth"
  | "bench"
  | "payroll"
  | "age"
  | "size";
type StyleMapId = StylePresetId | `pt-${LeagueHubPlayTypeId}`;
type StyleGroup = {
  id: string;
  label: string;
  maps: readonly { id: StyleMapId; label: string }[];
  /** 最初に開くマップ（無ければ先頭） */
  initial?: StyleMapId;
};

const STYLE_PRESETS: Record<StylePresetId, LeagueHubScatterPreset<LeagueHubTeamMetric>> = {
  strength: LEAGUE_HUB_TEAM_STRENGTH,
  clutch: LEAGUE_HUB_TEAM_CLUTCH,
  three: LEAGUE_HUB_TEAM_THREE,
  attack: LEAGUE_HUB_TEAM_ATTACK,
  shotCreation: LEAGUE_HUB_TEAM_SHOT_CREATION,
  tempo: LEAGUE_HUB_TEAM_TEMPO,
  shotDefense: LEAGUE_HUB_TEAM_SHOT_DEFENSE,
  hustle: LEAGUE_HUB_TEAM_HUSTLE,
  contestSplit: LEAGUE_HUB_TEAM_CONTEST,
  passValue: LEAGUE_HUB_TEAM_PASS_VALUE,
  driveFinish: LEAGUE_HUB_TEAM_DRIVE_FINISH,
  screen: LEAGUE_HUB_TEAM_SCREEN,
  shotAllow: LEAGUE_HUB_TEAM_SHOT_ALLOW,
  rebound: LEAGUE_HUB_TEAM_REBOUND,
  turnover: LEAGUE_HUB_TEAM_TURNOVER,
  ace: LEAGUE_HUB_TEAM_ACE,
  depth: LEAGUE_HUB_TEAM_DEPTH,
  bench: LEAGUE_HUB_TEAM_BENCH,
  payroll: LEAGUE_HUB_TEAM_PAYROLL,
  age: LEAGUE_HUB_TEAM_AGE,
  size: LEAGUE_HUB_TEAM_SIZE,
};

const PLAY_STYLE_GROUPS: readonly StyleGroup[] = [
  {
    id: "overall",
    label: "OVERALL",
    maps: [
      { id: "strength", label: "OFF × DEF" },
      { id: "clutch", label: "CLUTCH" },
    ],
  },
  {
    id: "offense",
    label: "OFFENSE",
    maps: [
      { id: "three", label: "3PT" },
      { id: "attack", label: "PASS × DRIVE" },
      { id: "shotCreation", label: "C&S × PULLUP" },
      { id: "passValue", label: "PASS VALUE" },
      { id: "driveFinish", label: "DRIVE FG%" },
      { id: "screen", label: "SCREEN" },
      { id: "tempo", label: "TEMPO" },
    ],
  },
  {
    id: "playType",
    label: "PLAY TYPE",
    maps: LEAGUE_HUB_PLAY_TYPES.map((p) => ({ id: `pt-${p.id}` as const, label: p.short })),
    initial: "pt-pnrBh",
  },
  {
    id: "defense",
    label: "DEFENSE",
    maps: [
      { id: "shotDefense", label: "OPP FG%" },
      { id: "hustle", label: "HUSTLE" },
      { id: "contestSplit", label: "CONTEST" },
      { id: "shotAllow", label: "DISTANCE" },
      { id: "rebound", label: "REB" },
      { id: "turnover", label: "TOV" },
    ],
  },
];

const ROSTER_GROUPS: readonly StyleGroup[] = [
  {
    id: "roster",
    label: "ROSTER",
    maps: [
      { id: "ace", label: "ACE" },
      { id: "depth", label: "DEPTH" },
      { id: "bench", label: "BENCH" },
      { id: "payroll", label: "PAYROLL" },
      { id: "age", label: "AGE" },
      { id: "size", label: "SIZE" },
    ],
  },
];

function stylePreset(id: StyleMapId): LeagueHubScatterPreset<LeagueHubTeamMetric> {
  return id.startsWith("pt-")
    ? leagueHubPlayTypePreset(id.slice(3) as LeagueHubPlayTypeId)
    : STYLE_PRESETS[id as StylePresetId];
}

/** チームの散布図はすべて同じ形なので 1 枚で切り替える（背景は消さない） */
function StyleMaps({
  title,
  groups,
  rows,
  lang,
  onSelectTeam,
}: {
  title: string;
  groups: readonly StyleGroup[];
  rows: NbaLeagueTeamStatRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [groupId, setGroupId] = useState(groups[0]!.id);
  /** グループを行き来しても、それぞれ最後に見たマップに戻る */
  const [mapByGroup, setMapByGroup] = useState<Record<string, StyleMapId>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.initial ?? g.maps[0]!.id]))
  );
  const group = groups.find((g) => g.id === groupId) ?? groups[0]!;
  const mapId = mapByGroup[groupId] ?? group.maps[0]!.id;
  const preset = useMemo(() => stylePreset(mapId), [mapId]);
  const strength = mapId === "strength";
  return (
    <HubSection title={title}>
      {groups.length > 1 ? (
        <HubSlantedTabs
          items={groups.map((g) => ({ id: g.id, label: g.label }))}
          value={groupId}
          onChange={setGroupId}
        />
      ) : null}
      <HubScrollSlantedTabs
        items={group.maps}
        value={mapId}
        onChange={(id) => setMapByGroup((prev) => ({ ...prev, [groupId]: id }))}
      />
      <Text style={styles.mapHint}>{preset.hint[lang]}</Text>
      <TeamScatterBlock
        rows={rows}
        preset={preset}
        lang={lang}
        sizeBy={strength ? "pace" : undefined}
        fourFactors={strength}
        onSelectTeam={onSelectTeam}
      />
    </HubSection>
  );
}

type RecordMode = "streak" | ConditionId;

const RECORD_MODES: readonly { id: RecordMode; label: string }[] = [
  { id: "streak", label: "STREAK" },
  { id: "close", label: "CLOSE ≤5" },
  { id: "b2b", label: "B2B" },
  { id: "threeInFour", label: "3IN4" },
  { id: "vsOver500", label: "VS .500+" },
  { id: "home", label: "HOME" },
  { id: "away", label: "AWAY" },
  { id: "vsEast", label: "VS EAST" },
  { id: "vsWest", label: "VS WEST" },
];

const RECORD_HINTS: Record<RecordMode, Record<HubLang, string>> = {
  streak: {
    ja: "いま続いている連勝・連敗。L10 は直近 10 試合の成績。",
    en: "Current win and losing streaks. L10 = last 10 games.",
  },
  close: {
    ja: "5 点差以内で決着した試合の勝敗。接戦に強いチームと弱いチーム。2 試合以上のチームだけ。",
    en: "Record in games decided by 5 or fewer points. Teams with 2+ such games.",
  },
  b2b: {
    ja: "連戦 2 日目（前日も試合）の勝敗。疲れに強いチームと弱いチーム。2 試合以上のチームだけ。",
    en: "Record on the second night of back-to-backs. Teams with 2+ such games.",
  },
  threeInFour: {
    ja: "4 日で 3 試合目の勝敗（B2B と重なる試合もある）。B2B よりきつい日程。2 試合以上のチームだけ。",
    en: "Record in the third game in four nights (can overlap B2B). Teams with 2+ such games.",
  },
  vsEast: {
    ja: "東カンファレンスの相手との勝敗。2 試合以上のチームだけ。",
    en: "Record against Eastern Conference teams. Teams with 2+ such games.",
  },
  vsWest: {
    ja: "西カンファレンスの相手との勝敗。2 試合以上のチームだけ。",
    en: "Record against Western Conference teams. Teams with 2+ such games.",
  },
  vsOver500: {
    ja: "勝率 5 割以上の相手との勝敗（相手の勝率は試合前の時点）。2 試合以上のチームだけ。",
    en: "Record against .500+ teams (record before the game). Teams with 2+ such games.",
  },
  home: {
    ja: "ホームでの勝敗。2 試合以上のチームだけ。",
    en: "Home record. Teams with 2+ home games.",
  },
  away: {
    ja: "アウェーでの勝敗。2 試合以上のチームだけ。",
    en: "Road record. Teams with 2+ road games.",
  },
};

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
  const [showAll, setShowAll] = useState(false);
  const ja = lang === "ja";
  const league = mode === "streak" ? null : leagueRecord(teams, mode);
  const leaguePct = recordPct(league);
  const leagueLabel =
    leaguePct == null ? "" : `${ja ? "リーグ全体" : "LEAGUE"} ${formatPct(leaguePct)}`;
  return (
    <HubSection title="FORM & SPLITS">
      <HubScrollSlantedTabs items={RECORD_MODES} value={mode} onChange={setMode} />
      <Text style={styles.mapHint}>{RECORD_HINTS[mode][lang]}</Text>
      {league && leaguePct != null ? (
        <Text style={styles.avgNote}>
          {leagueLabel}
          <Text style={styles.avgNoteSub}>
            {"  "}
            {formatRecord(league)}
            {ja ? "（全チームの合計）" : " (all teams combined)"}
          </Text>
        </Text>
      ) : null}
      {mode === "streak" ? (
        <TeamForm teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      ) : (
        <Conditions cond={mode} teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      )}
      {teams.length > 0 ? (
        <Pressable
          onPress={() => setShowAll((v) => !v)}
          style={({ pressed }) => [styles.allBtn, pressed ? styles.cardPressed : null]}
          accessibilityRole="button"
          accessibilityState={{ expanded: showAll }}
        >
          <Text style={styles.allBtnText}>
            {showAll
              ? ja
                ? "閉じる ▲"
                : "CLOSE ▲"
              : ja
                ? `全 ${teams.length} チームを見る ▼`
                : `ALL ${teams.length} TEAMS ▼`}
          </Text>
        </Pressable>
      ) : null}
      {showAll ? (
        <AllTeamRecords
          mode={mode}
          teams={teams}
          leaguePct={leaguePct}
          leagueLabel={leagueLabel}
          onSelectTeam={onSelectTeam}
        />
      ) : null}
    </HubSection>
  );
}

/** 全チームの合計。接戦は両チーム分を足すと必ず 5 割になるので出さない */
function leagueRecord(teams: LeagueHubTeamRow[], cond: ConditionId): LeagueHubRecord | null {
  if (cond === "close") return null;
  let wins = 0;
  let losses = 0;
  for (const t of teams) {
    const r = t[cond];
    if (!r) continue;
    wins += r.wins;
    losses += r.losses;
  }
  return wins + losses > 0 ? { wins, losses } : null;
}

function formatPct(pct: number): string {
  return pct.toFixed(3).replace(/^0/, "");
}

function recordGames(rec: LeagueHubRecord | null | undefined): number {
  return rec ? rec.wins + rec.losses : 0;
}

/** 勝率が同じなら試合数が多いほうを上（全勝なら多く勝ったほう・全敗なら多く負けたほうが端） */
function compareRecords(a: LeagueHubRecord, b: LeagueHubRecord, dir: "best" | "worst"): number {
  const pa = recordPct(a) ?? 0;
  const pb = recordPct(b) ?? 0;
  return (dir === "best" ? pb - pa : pa - pb) || recordGames(b) - recordGames(a);
}

/** 連勝は長い順 → 連勝・連敗なし → 連敗は短い順。同じなら L10 の良い順 */
function streakScore(t: LeagueHubTeamRow): number {
  if (!t.streak) return 0;
  return t.streak.kind === "W" ? t.streak.count : -t.streak.count;
}

/** 30 チームを 1 列で上から良い順に */
function AllTeamRecords({
  mode,
  teams,
  leaguePct,
  leagueLabel,
  onSelectTeam,
}: {
  mode: RecordMode;
  teams: LeagueHubTeamRow[];
  leaguePct: number | null;
  leagueLabel: string;
  onSelectTeam: (teamId: string) => void;
}) {
  const rows = useMemo(() => {
    if (mode === "streak") {
      return [...teams]
        .sort(
          (a, b) =>
            streakScore(b) - streakScore(a) ||
            (recordPct(b.last10) ?? 0) - (recordPct(a.last10) ?? 0)
        )
        .map((t) => ({
          t,
          value: t.streak ? `${t.streak.kind}${t.streak.count}` : "—",
          sub: `L10 ${formatRecord(t.last10)}`,
          pct: null as number | null,
        }));
    }
    const played = teams.filter((t) => recordGames(t[mode]) > 0);
    const none = teams.filter((t) => recordGames(t[mode]) === 0);
    return [
      ...played
        .sort((a, b) => compareRecords(a[mode]!, b[mode]!, "best"))
        .map((t) => ({
          t,
          value: formatRecord(t[mode]),
          sub: formatPct(recordPct(t[mode]) ?? 0),
          pct: recordPct(t[mode]),
        })),
      ...none.map((t) => ({ t, value: "—", sub: "", pct: null })),
    ];
  }, [mode, teams]);
  /** 勝率がリーグ全体を下回る最初の行の上に線を引く */
  const splitAt =
    leaguePct == null ? -1 : rows.findIndex((r) => r.pct == null || r.pct < leaguePct);
  return (
    <View style={styles.allList}>
      {rows.map(({ t, value, sub }, i) => (
        <Fragment key={t.teamId}>
          {i === splitAt && i > 0 ? <HubAvgDivider label={leagueLabel} /> : null}
          <HubRow
            rank={i + 1}
            teamId={t.teamId}
            name={nick(t.teamId)}
            kind="team"
            value={value}
            valueSub={sub || undefined}
            onPress={() => onSelectTeam(t.teamId)}
            framed
          />
        </Fragment>
      ))}
    </View>
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

const POS_DEF_UNIT: Record<LeagueHubPosDefStat, { ja: string; en: string }> = {
  pts: { ja: "点", en: "PTS" },
  reb: { ja: "リバウンド", en: "REB" },
  ast: { ja: "アシスト", en: "AST" },
  fg3m: { ja: "本（3P 成功）", en: "3PM" },
};

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
  const [stat, setStat] = useState<LeagueHubPosDefStat>("pts");
  /** asc = 取られた数が少ない順（1 位から） */
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const ja = lang === "ja";
  const hasMore = teams.some((t) => t.posDef?.[pos]?.stats != null);
  const rows = teams
    .map((t) => {
      const c = t.posDef?.[pos];
      const cell = !c ? null : stat === "pts" ? { value: c.pts, rank: c.rank } : (c.stats?.[stat] ?? null);
      return { t, cell };
    })
    .filter((x): x is { t: LeagueHubTeamRow; cell: { value: number; rank: number } } => x.cell != null)
    .sort((a, b) => (order === "asc" ? a.cell.rank - b.cell.rank : b.cell.rank - a.cell.rank));
  /** チーム試合ログ側の leagueAvg と同じく 30 チームの単純平均 */
  const avg = rows.length > 0 ? rows.reduce((sum, x) => sum + x.cell.value, 0) / rows.length : null;
  const avgLabel = avg == null ? "" : `${ja ? "リーグ平均" : "LEAGUE AVG"} ${avg.toFixed(1)}`;
  const splitAt =
    avg == null
      ? -1
      : rows.findIndex(({ cell }) => (order === "asc" ? cell.value > avg : cell.value < avg));
  const unit = POS_DEF_UNIT[stat][ja ? "ja" : "en"];
  return (
    <View>
      <HubSlantedTabs
        items={[
          { id: "G", label: "GUARDS" },
          { id: "F", label: "FORWARDS" },
          { id: "C", label: "CENTERS" },
        ]}
        value={pos}
        onChange={setPos}
      />
      {hasMore ? (
        <HubSlantedTabs
          items={[
            { id: "pts", label: "PTS" },
            { id: "reb", label: "REB" },
            { id: "ast", label: "AST" },
            { id: "fg3m", label: "3PM" },
          ]}
          value={stat}
          onChange={setStat}
        />
      ) : null}
      {rows.length === 0 ? (
        <HubEmpty text={ja ? "まだデータがありません" : "No data yet"} />
      ) : (
        <>
          {avg != null ? (
            <Text style={styles.avgNote}>
              {avgLabel}
              <Text style={styles.avgNoteSub}>
                {ja
                  ? `  ${unit} · 右下は平均との差（緑 = 平均より少ない）`
                  : `  ${unit} · below = vs average (green = fewer)`}
              </Text>
            </Text>
          ) : null}
          <Pressable
            onPress={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
            style={({ pressed }) => [styles.allBtn, pressed ? styles.cardPressed : null]}
            accessibilityRole="button"
          >
            <Text style={styles.allBtnText}>
              {order === "asc"
                ? ja
                  ? "取られた数が少ない順 ▲（押すと多い順）"
                  : "FEWEST ALLOWED FIRST ▲"
                : ja
                  ? "取られた数が多い順 ▼（押すと少ない順）"
                  : "MOST ALLOWED FIRST ▼"}
            </Text>
          </Pressable>
          <View style={styles.allList}>
            {rows.map(({ t, cell }, i) => {
              const diff = avg == null ? 0 : cell.value - avg;
              const even = Math.abs(diff) < 0.05;
              return (
                <Fragment key={t.teamId}>
                  {i === splitAt && i > 0 ? <HubAvgDivider label={avgLabel} /> : null}
                  <HubRow
                    rank={cell.rank}
                    teamId={t.teamId}
                    name={nick(t.teamId)}
                    kind="team"
                    value={cell.value.toFixed(1)}
                    valueSub={even ? "±0.0" : `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}`}
                    valueSubColor={even ? undefined : diff < 0 ? HUB_GOOD_COLOR : HUB_BAD_COLOR}
                    onPress={() => onSelectTeam(t.teamId)}
                    framed
                  />
                </Fragment>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

function signed(v: number): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(1)}`;
}

/** 対戦相手の今の勝率の平均（終わった試合 / 残り日程） */
function ScheduleStrength({
  teams,
  lang,
  onSelectTeam,
}: {
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [mode, setMode] = useState<"played" | "remaining">("played");
  const [showAll, setShowAll] = useState(false);
  const ja = lang === "ja";
  if (!teams.some((t) => t.schedule != null)) return null;
  const played = mode === "played";
  const rows = teams
    .flatMap((t) => {
      const s = t.schedule;
      const v = s ? (played ? s.played : s.remaining) : null;
      return s && v != null ? [{ t, v, games: played ? s.playedGames : s.remainingGames }] : [];
    })
    .sort((a, b) => b.v - a.v);
  const avg = rows.length > 0 ? rows.reduce((sum, r) => sum + r.v, 0) / rows.length : null;
  const avgLabel = avg == null ? "" : `${ja ? "リーグ平均" : "LEAGUE AVG"} ${formatPct(avg)}`;
  const row = ({ t, v, games }: (typeof rows)[number], rank?: number) => (
    <HubRow
      key={t.teamId}
      rank={rank}
      teamId={t.teamId}
      name={nick(t.teamId)}
      kind="team"
      value={formatPct(v)}
      valueSub={played ? `${t.wins}-${t.losses}` : ja ? `残り ${games}` : `${games} left`}
      onPress={() => onSelectTeam(t.teamId)}
      framed
    />
  );
  const splitAt = avg == null ? -1 : rows.findIndex((r) => r.v < avg);
  return (
    <HubSection title="SCHEDULE">
      <HubSlantedTabs
        items={[
          { id: "played", label: "PLAYED" },
          { id: "remaining", label: "REMAINING" },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Text style={styles.mapHint}>
        {played
          ? ja
            ? "これまで当たった相手の、今の勝率の平均。高いほど強い相手と戦ってきた（同じ成績でも価値が違う）。"
            : "Average current win % of opponents faced so far. Higher = tougher schedule."
          : ja
            ? "残り日程の相手の、今の勝率の平均。高いほどこの先がきつい。"
            : "Average current win % of remaining opponents. Higher = tougher road ahead."}
      </Text>
      {rows.length === 0 ? (
        <HubEmpty text={ja ? "まだデータがありません" : "No data yet"} />
      ) : (
        <>
          <HubTwoCol
            leftTitle={ja ? "楽" : "EASIEST"}
            rightTitle={ja ? "厳しい" : "HARDEST"}
            left={[...rows].reverse().slice(0, 5).map((r) => row(r))}
            right={rows.slice(0, 5).map((r) => row(r))}
          />
          <Pressable
            onPress={() => setShowAll((v) => !v)}
            style={({ pressed }) => [styles.allBtn, pressed ? styles.cardPressed : null]}
            accessibilityRole="button"
            accessibilityState={{ expanded: showAll }}
          >
            <Text style={styles.allBtnText}>
              {showAll
                ? ja
                  ? "閉じる ▲"
                  : "CLOSE ▲"
                : ja
                  ? `全 ${rows.length} チームを見る（厳しい順）▼`
                  : `ALL ${rows.length} TEAMS (HARDEST FIRST) ▼`}
            </Text>
          </Pressable>
          {showAll ? (
            <View style={styles.allList}>
              {rows.map((r, i) => (
                <Fragment key={r.t.teamId}>
                  {i === splitAt && i > 0 ? <HubAvgDivider label={avgLabel} /> : null}
                  {row(r, i + 1)}
                </Fragment>
              ))}
            </View>
          ) : null}
        </>
      )}
    </HubSection>
  );
}

/** UNITERZ ユーザーの勝敗予想（選んだ割合の合計）と実際の勝ち数 */
function UniterzPicks({
  teams,
  lang,
  onSelectTeam,
}: {
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const ja = lang === "ja";
  if (!teams.some((t) => t.picks !== undefined)) return null;
  const rows = teams.flatMap((t) =>
    t.picks && t.picks.games >= 3 ? [{ t, p: t.picks, diff: t.picks.wins - t.picks.expectedWins }] : []
  );
  // 1 試合は両チームに 1 回ずつ数えている
  const games = rows.reduce((s, r) => s + r.p.games, 0) / 2;
  const hits = rows.reduce((s, r) => s + r.p.majorityHits, 0) / 2;
  const list = (xs: typeof rows) =>
    xs.length === 0 ? (
      <HubEmpty text="—" />
    ) : (
      xs.map(({ t, p, diff }) => (
        <HubRow
          key={t.teamId}
          teamId={t.teamId}
          name={nick(t.teamId)}
          kind="team"
          value={signed(diff)}
          valueSub={
            ja
              ? `予想 ${p.expectedWins.toFixed(1)} → ${p.wins} 勝`
              : `exp ${p.expectedWins.toFixed(1)} → ${p.wins} W`
          }
          valueSubColor={diff > 0 ? HUB_GOOD_COLOR : HUB_BAD_COLOR}
          onPress={() => onSelectTeam(t.teamId)}
          framed
        />
      ))
    );
  return (
    <HubSection title="UNITERZ PICKS">
      <Text style={styles.mapHint}>
        {ja
          ? "UNITERZ のみんなの勝敗予想で、そのチームを選んだ人の割合を試合ごとに足したものが「予想の勝ち数」。実際の勝ち数との差で、みんなが低く見ている・高く見ているチームがわかります。3 試合以上のチームだけ。"
          : "Share of UNITERZ users picking the team, summed over games = expected wins. Compared with actual wins to find under- and overrated teams. Teams with 3+ games."}
      </Text>
      {rows.length === 0 ? (
        <HubEmpty text={ja ? "まだ試合が少ないです" : "Not enough games yet"} />
      ) : (
        <>
          {games > 0 ? (
            <Text style={styles.avgNote}>
              {ja ? "多数派の的中率" : "MAJORITY PICK HIT RATE"} {Math.round((hits / games) * 100)}%
              <Text style={styles.avgNoteSub}>
                {ja ? `  ${games} 試合` : `  ${games} games`}
              </Text>
            </Text>
          ) : null}
          <HubTwoCol
            leftTitle={ja ? "予想より勝つ" : "UNDERRATED"}
            rightTitle={ja ? "予想より負ける" : "OVERRATED"}
            left={list(
              rows
                .filter((r) => r.diff > 0)
                .sort((a, b) => b.diff - a.diff)
                .slice(0, 5)
            )}
            right={list(
              rows
                .filter((r) => r.diff < 0)
                .sort((a, b) => a.diff - b.diff)
                .slice(0, 5)
            )}
          />
        </>
      )}
    </HubSection>
  );
}

type ConditionId =
  | "b2b"
  | "threeInFour"
  | "close"
  | "vsOver500"
  | "home"
  | "away"
  | "vsEast"
  | "vsWest";

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
  const best = [...rows].sort((a, b) => compareRecords(a.rec, b.rec, "best")).slice(0, 5);
  const worst = [...rows].sort((a, b) => compareRecords(a.rec, b.rec, "worst")).slice(0, 5);
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
export default function LeagueHubTeamPanelNative({ hub, lang, section, onSelectTeam }: Props) {
  const { bundle, loading } = useLeagueTeamStatsBundle({
    apiBaseUrl: getUniterzApiBaseUrl(),
    season: CURRENT_NBA_SEASON_KEY,
  });
  const rows = bundle.season;
  const teams = hub?.teams ?? [];
  /** ロスターの指標は hub 側にあるのでリーグ表の行に重ねる */
  const rosterRows = useMemo(() => {
    const byTeam = new Map(teams.map((t) => [t.teamId, t.m]));
    return rows.map((r) => ({ ...r, ...byTeam.get(r.teamId) }));
  }, [rows, teams]);

  /** 切り替えてもマップの選択などを残すため、隠すだけでアンマウントしない */
  const shown = (id: LeagueHubTeamSection) => (section === id ? null : styles.hidden);
  const rowsLoading = loading && rows.length === 0;
  const spinner = (
    <View style={styles.loading}>
      <ActivityIndicator color={CYBER_TAB_CYAN} />
    </View>
  );

  return (
    <View>
      <View style={shown("style")}>
        {rowsLoading ? (
          spinner
        ) : (
          <>
            <StyleMaps
              title="PLAY STYLE"
              groups={PLAY_STYLE_GROUPS}
              rows={rows}
              lang={lang}
              onSelectTeam={onSelectTeam}
            />
            <StyleMaps
              title="ROSTER"
              groups={ROSTER_GROUPS}
              rows={rosterRows}
              lang={lang}
              onSelectTeam={onSelectTeam}
            />
          </>
        )}
      </View>

      <View style={shown("scoring")}>
        {rowsLoading ? (
          spinner
        ) : (
          <HubSection title="SCORING MIX">
            <ScoringMix rows={rows} lang={lang} onSelectTeam={onSelectTeam} />
          </HubSection>
        )}
      </View>

      <View style={shown("form")}>
        <TeamRecords teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
        <ScheduleStrength teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
        <UniterzPicks teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      </View>

      <View style={shown("defense")}>
        <HubSection title="ALLOWED BY POSITION">
          <Text style={styles.mapHint}>
            {lang === "ja"
              ? "相手のガード・フォワード・センターに 1 試合で取られた得点・リバウンド・アシスト・3P。順位は少ないほど上。"
              : "Per game allowed to opposing guards, forwards and centers. Rank 1 = fewest."}
          </Text>
          <PositionDefense teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
        </HubSection>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  hidden: { display: "none" },
  allBtn: {
    marginTop: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    alignItems: "center",
  },
  allBtnText: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  allList: {
    marginTop: 10,
  },
  avgNote: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  avgNoteSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0,
  },
  mapHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 6,
  },
  tapHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 6,
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
  legendSpacer: {
    flex: 1,
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
  mixRank: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    width: 16,
    textAlign: "right",
  },
  mixAvg: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#fff",
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
