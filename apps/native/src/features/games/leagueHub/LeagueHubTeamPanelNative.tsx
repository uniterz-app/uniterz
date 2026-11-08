import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { getNbaTeamNicknameById } from "../../../../../../lib/nba-team-names";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import type { NbaLeagueTeamStatRow } from "../../../../../../lib/predict/nbaLeagueTeamStatsMocks";
import {
  LEAGUE_HUB_PLAY_TYPES,
  LEAGUE_HUB_TEAM_CLUTCH,
  LEAGUE_HUB_TEAM_HUSTLE,
  LEAGUE_HUB_TEAM_STRENGTH,
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
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import LeagueHubScatterNative, { type HubScatterPoint } from "./LeagueHubScatterNative";
import {
  HubChips,
  HubEmpty,
  HubRow,
  HubSection,
  HubTwoCol,
  formatHubValue,
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

function TeamScatterBlock({
  rows,
  preset,
  lang,
  sizeBy,
  onSelectTeam,
}: {
  rows: NbaLeagueTeamStatRow[];
  preset: LeagueHubScatterPreset<LeagueHubTeamMetric>;
  lang: HubLang;
  sizeBy?: LeagueHubTeamMetric;
  onSelectTeam: (teamId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
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
      />
      {sel ? (
        <Pressable style={styles.selRow} onPress={() => onSelectTeam(sel.teamId)}>
          <Text style={[styles.selName, teamNameStyle]}>{nick(sel.teamId)}</Text>
          <View style={styles.selStats}>
            {([preset.x, preset.y] as const).map((ax) => {
              const rank = rankOf(rows, sel.teamId, ax.metric, ax.invert);
              return (
                <Text key={ax.metric} style={styles.selStat}>
                  {ax.label[lang].replace(/（.*）|\(.*\)/, "").trim()}{" "}
                  <Text style={styles.selStatValue}>
                    {formatHubValue(metricOf(sel, ax.metric), ax.format)}
                  </Text>
                  {rank ? ` #${rank}` : ""}
                </Text>
              );
            })}
            {sizeBy ? (
              <Text style={styles.selStat}>
                PACE <Text style={styles.selStatValue}>{formatHubValue(metricOf(sel, sizeBy), "one")}</Text>
              </Text>
            ) : null}
          </View>
          <Text style={styles.selGo}>{lang === "ja" ? "詳細 ›" : "DETAIL ›"}</Text>
        </Pressable>
      ) : (
        <Text style={styles.tapHint}>
          {lang === "ja" ? "ユニフォームをタップで数字を表示" : "Tap a jersey for numbers"}
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
      <HubChips
        items={MIX_SEGMENTS.map((s) => ({
          id: s.id,
          label: lang === "ja" ? `${s.label} 順` : `BY ${s.label}`,
        }))}
        value={sortBy}
        onChange={setSortBy}
      />
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

function PlayTypes({
  rows,
  lang,
  onSelectTeam,
}: {
  rows: NbaLeagueTeamStatRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [pt, setPt] = useState<LeagueHubPlayTypeId>("pnrBh");
  const preset = useMemo(() => leagueHubPlayTypePreset(pt), [pt]);
  return (
    <View>
      <HubChips
        items={LEAGUE_HUB_PLAY_TYPES.map((p) => ({ id: p.id, label: p.short }))}
        value={pt}
        onChange={setPt}
      />
      <Text style={styles.subHint}>{preset.hint[lang]}</Text>
      <TeamScatterBlock key={pt} rows={rows} preset={preset} lang={lang} onSelectTeam={onSelectTeam} />
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
        />
      ))
    );
  return (
    <HubTwoCol
      leftTitle={lang === "ja" ? "連勝中" : "WIN STREAKS"}
      rightTitle={lang === "ja" ? "連敗中" : "SKIDS"}
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
      />
    ));
  return (
    <View>
      <HubChips
        items={[
          { id: "G", label: lang === "ja" ? "ガード" : "GUARDS" },
          { id: "F", label: lang === "ja" ? "フォワード" : "FORWARDS" },
          { id: "C", label: lang === "ja" ? "センター" : "CENTERS" },
        ]}
        value={pos}
        onChange={setPos}
      />
      <HubTwoCol
        leftTitle={lang === "ja" ? "抑えている" : "STINGIEST"}
        rightTitle={lang === "ja" ? "やられている" : "LEAKIEST"}
        left={list(rows.slice(0, 5))}
        right={list(rows.slice(-5).reverse())}
      />
    </View>
  );
}

type ConditionId = "b2b" | "close" | "vsOver500" | "home" | "away";

function Conditions({
  teams,
  lang,
  onSelectTeam,
}: {
  teams: LeagueHubTeamRow[];
  lang: HubLang;
  onSelectTeam: (teamId: string) => void;
}) {
  const [cond, setCond] = useState<ConditionId>("close");
  const rows = teams
    .map((t) => ({ t, rec: t[cond] as LeagueHubRecord | null }))
    .filter(
      (x): x is { t: LeagueHubTeamRow; rec: LeagueHubRecord } =>
        x.rec != null && x.rec.wins + x.rec.losses >= 2
    )
    .map((x) => ({ ...x, pct: recordPct(x.rec) ?? 0 }));
  if (rows.length === 0) {
    return (
      <View>
        <ConditionChips cond={cond} setCond={setCond} lang={lang} />
        <HubEmpty text={lang === "ja" ? "まだ試合が少ないです" : "Not enough games yet"} />
      </View>
    );
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
      />
    ));
  return (
    <View>
      <ConditionChips cond={cond} setCond={setCond} lang={lang} />
      <HubTwoCol
        leftTitle={lang === "ja" ? "強い" : "BEST"}
        rightTitle={lang === "ja" ? "弱い" : "WORST"}
        left={list(best)}
        right={list(worst)}
      />
    </View>
  );
}

function ConditionChips({
  cond,
  setCond,
  lang,
}: {
  cond: ConditionId;
  setCond: (c: ConditionId) => void;
  lang: HubLang;
}) {
  return (
    <HubChips
      items={[
        { id: "close", label: lang === "ja" ? "5点差以内" : "CLOSE ≤5" },
        { id: "b2b", label: lang === "ja" ? "連戦2日目" : "B2B" },
        { id: "vsOver500", label: lang === "ja" ? "勝ち越し相手" : "VS .500+" },
        { id: "home", label: lang === "ja" ? "ホーム" : "HOME" },
        { id: "away", label: lang === "ja" ? "アウェー" : "AWAY" },
      ]}
      value={cond}
      onChange={setCond}
    />
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
      <HubSection title={LEAGUE_HUB_TEAM_STRENGTH.label[lang]} hint={LEAGUE_HUB_TEAM_STRENGTH.hint[lang]}>
        <TeamScatterBlock
          rows={rows}
          preset={LEAGUE_HUB_TEAM_STRENGTH}
          lang={lang}
          sizeBy="pace"
          onSelectTeam={onSelectTeam}
        />
      </HubSection>

      <HubSection
        title={lang === "ja" ? "得点の内訳" : "SCORING MIX"}
        hint={
          lang === "ja"
            ? "得点のうち 3P・ペイント・ミドル・フリースローが占める割合。"
            : "Share of points from 3s, the paint, mid-range and free throws."
        }
      >
        <ScoringMix rows={rows} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <HubSection title={lang === "ja" ? "得意なプレー" : "PLAY TYPES"}>
        <PlayTypes rows={rows} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <HubSection title={LEAGUE_HUB_TEAM_HUSTLE.label[lang]} hint={LEAGUE_HUB_TEAM_HUSTLE.hint[lang]}>
        <TeamScatterBlock rows={rows} preset={LEAGUE_HUB_TEAM_HUSTLE} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <HubSection title={LEAGUE_HUB_TEAM_CLUTCH.label[lang]} hint={LEAGUE_HUB_TEAM_CLUTCH.hint[lang]}>
        <TeamScatterBlock rows={rows} preset={LEAGUE_HUB_TEAM_CLUTCH} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <HubSection title={lang === "ja" ? "勢い" : "FORM"}>
        <TeamForm teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <HubSection
        title={lang === "ja" ? "ポジション別の失点" : "POINTS ALLOWED BY POSITION"}
        hint={
          lang === "ja"
            ? "相手のガード・フォワード・センターに 1 試合で取られた得点。"
            : "Points per game allowed to opposing guards, forwards and centers."
        }
      >
        <PositionDefense teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>

      <HubSection
        title={lang === "ja" ? "状況別の勝敗" : "RECORD BY SITUATION"}
        hint={lang === "ja" ? "2 試合以上あるチームだけ。" : "Teams with 2+ games only."}
      >
        <Conditions teams={teams} lang={lang} onSelectTeam={onSelectTeam} />
      </HubSection>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  selRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  selName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  selStats: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 2,
  },
  selStat: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
  },
  selStatValue: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  selGo: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 11,
    fontWeight: "800",
  },
  tapHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 6,
  },
  subHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
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
