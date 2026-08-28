/**
 * DEV: 前季チーム成績スプリット（home/away・H2H用集計・対.500・対上位）確認画面。
 * Web `GET /api/nba/team-season-records` を読む。
 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { MATCH_CARD_DISPLAY_FONT } from "../matchCardTypography";

type Wl = { wins: number; losses: number };

type TeamRow = {
  teamId: string;
  teamName: string;
  abbr: string;
  overall: Wl;
  home: Wl;
  away: Wl;
  vsOver500: Wl;
  vsUnder500: Wl;
  vsConfTop6: Wl;
  vsConfTop6Home: Wl;
  vsConfTop6Away: Wl;
  overallPct: number;
  homePct: number;
  awayPct: number;
  vsOver500Pct: number;
  vsUnder500Pct: number;
  vsConfTop6Pct: number;
};

type Payload = {
  ok: true;
  season: string;
  gameCount: number;
  teamCount: number;
  source: string;
  teams: TeamRow[];
};

type AceOutPlayer = {
  playerId: string;
  playerName: string;
  ppg: number;
  whenOut: Wl;
  whenOutPct: number;
  gamesOut: number;
  source: string;
  whenOutPtsFor?: number;
  whenOutPtsAgainst?: number;
};

type AceOutRow = {
  teamId: string;
  acePlayerName: string;
  acePpg: number;
  whenOut: Wl;
  whenOutPct: number;
  gamesOut: number;
  teamPtsFor?: number;
  teamPtsAgainst?: number;
  players?: AceOutPlayer[];
};

type AcePayload = {
  ok: true;
  season: string;
  gameCount: number;
  teamCount: number;
  source: string;
  teams: AceOutRow[];
};

const SEASON = "2025-26";

function fmt(r: Wl): string {
  return `${r.wins}-${r.losses}`;
}

function pctLabel(p: number): string {
  return `${p.toFixed(1)}%`;
}

function StatLine({
  label,
  record,
  pct,
}: {
  label: string;
  record: Wl;
  pct: number;
}) {
  const total = record.wins + record.losses;
  return (
    <View style={styles.statLine}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {total > 0 ? `${fmt(record)}  (${pctLabel(pct)})` : "—"}
      </Text>
    </View>
  );
}

export default function TeamSeasonRecordsPreviewScreenNative() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [data, setData] = useState<Payload | null>(null);
  const [aceByTeam, setAceByTeam] = useState<Record<string, AceOutRow>>({});
  const [aceMeta, setAceMeta] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = getUniterzApiBaseUrl()?.replace(/\/$/, "") ?? "";
      const seasonQ = encodeURIComponent(SEASON);
      const [recRes, aceRes] = await Promise.all([
        fetch(`${base}/api/nba/team-season-records?season=${seasonQ}`),
        fetch(`${base}/api/nba/team-ace-out-records?season=${seasonQ}`),
      ]);
      if (!recRes.ok) throw new Error(`records HTTP ${recRes.status}`);
      const json = (await recRes.json()) as Payload | { ok: false; error?: string };
      if (!json.ok) throw new Error((json as { error?: string }).error ?? "failed");
      setData(json as Payload);

      if (aceRes.ok) {
        const aceJson = (await aceRes.json()) as
          | AcePayload
          | { ok: false; error?: string };
        if (aceJson.ok) {
          const map: Record<string, AceOutRow> = {};
          for (const t of aceJson.teams) map[t.teamId] = t;
          setAceByTeam(map);
          setAceMeta(
            `ace-out games ${aceJson.gameCount} · teams ${aceJson.teamCount} · ${aceJson.source}`
          );
        } else {
          setAceByTeam({});
          setAceMeta("ace-out: empty");
        }
      } else {
        setAceByTeam({});
        setAceMeta(`ace-out HTTP ${aceRes.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
      setAceByTeam({});
      setAceMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#E8EEF8" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>DEV · PRO INSIGHT DATA</Text>
          <Text style={styles.title}>Team Season Records</Text>
          <Text style={styles.sub}>
            {SEASON} · 試合時点の対.500 / 対カンファ上位6
          </Text>
        </View>
        <Pressable onPress={() => void load()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="refresh" size={20} color="#00F5FF" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#00F5FF" />
          <Text style={styles.hint}>読み込み中…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.hint}>
            API が起動しているか、集計済みか確認してください。
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.metaCard}>
            <Text style={styles.metaLine}>
              games {data?.gameCount ?? 0} · teams {data?.teamCount ?? 0} ·{" "}
              {data?.source}
            </Text>
            <Text style={styles.metaNote}>
              エース = チーム最高 PPG（min GP）。欠場 =
              その試合で min=0 / 不在。Insight は OUT 時に欠場時 W–L を折り込む。
            </Text>
            {aceMeta ? (
              <Text style={styles.metaLine}>{aceMeta}</Text>
            ) : null}
          </View>

          {(data?.teams ?? []).map((t, i) => {
            const open = expandedId === t.teamId;
            const ace = aceByTeam[t.teamId];
            return (
              <Pressable
                key={t.teamId}
                onPress={() =>
                  setExpandedId(open ? null : t.teamId)
                }
                style={styles.card}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={styles.cardTitleCol}>
                    <Text style={styles.abbr}>{t.abbr}</Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {t.teamName}
                    </Text>
                  </View>
                  <Text style={styles.overall}>
                    {fmt(t.overall)}
                    {"\n"}
                    <Text style={styles.overallPct}>
                      {pctLabel(t.overallPct)}
                    </Text>
                  </Text>
                </View>

                <View style={styles.chipRow}>
                  <Text style={styles.chip}>H {fmt(t.home)}</Text>
                  <Text style={styles.chip}>A {fmt(t.away)}</Text>
                  <Text style={styles.chip}>.500+ {fmt(t.vsOver500)}</Text>
                  <Text style={styles.chip}>&lt;.500 {fmt(t.vsUnder500)}</Text>
                  <Text style={styles.chip}>TOP6 {fmt(t.vsConfTop6)}</Text>
                  {ace ? (
                    <Text style={styles.aceChip}>
                      ACE OUT {fmt(ace.whenOut)} · {ace.acePlayerName}
                    </Text>
                  ) : null}
                  {(ace?.players ?? [])
                    .filter((p) => p.playerName !== ace?.acePlayerName)
                    .map((p) => (
                      <Text key={p.playerId} style={styles.keyChip}>
                        KEY OUT {fmt(p.whenOut)} · {p.playerName}
                      </Text>
                    ))}
                </View>

                {open ? (
                  <View style={styles.detail}>
                    <StatLine label="Overall" record={t.overall} pct={t.overallPct} />
                    <StatLine label="Home" record={t.home} pct={t.homePct} />
                    <StatLine label="Away" record={t.away} pct={t.awayPct} />
                    <StatLine
                      label="vs .500+"
                      record={t.vsOver500}
                      pct={t.vsOver500Pct}
                    />
                    <StatLine
                      label="vs sub-.500"
                      record={t.vsUnder500}
                      pct={t.vsUnder500Pct}
                    />
                    <StatLine
                      label="vs Conf Top6"
                      record={t.vsConfTop6}
                      pct={t.vsConfTop6Pct}
                    />
                    <StatLine
                      label="vs Top6 Home"
                      record={t.vsConfTop6Home}
                      pct={
                        t.vsConfTop6Home.wins + t.vsConfTop6Home.losses > 0
                          ? Math.round(
                              (t.vsConfTop6Home.wins /
                                (t.vsConfTop6Home.wins +
                                  t.vsConfTop6Home.losses)) *
                                1000
                            ) / 10
                          : 0
                      }
                    />
                    <StatLine
                      label="vs Top6 Away"
                      record={t.vsConfTop6Away}
                      pct={
                        t.vsConfTop6Away.wins + t.vsConfTop6Away.losses > 0
                          ? Math.round(
                              (t.vsConfTop6Away.wins /
                                (t.vsConfTop6Away.wins +
                                  t.vsConfTop6Away.losses)) *
                                1000
                            ) / 10
                          : 0
                      }
                    />
                    {(ace?.players ?? (ace
                      ? [
                          {
                            playerId: "ace",
                            playerName: ace.acePlayerName,
                            ppg: ace.acePpg,
                            whenOut: ace.whenOut,
                            whenOutPct: ace.whenOutPct,
                            gamesOut: ace.gamesOut,
                            source: "auto",
                          },
                        ]
                      : [])
                    ).map((p) => (
                      <StatLine
                        key={p.playerId}
                        label={`${p.source === "curated" ? "KEY" : "ACE"} out (${p.playerName} ${p.ppg}ppg · ${p.whenOutPtsFor ?? "—"}-${p.whenOutPtsAgainst ?? "—"})`}
                        record={p.whenOut}
                        pct={p.whenOutPct}
                      />
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  backBtn: { padding: 6 },
  headerText: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(0,245,255,0.75)",
  },
  title: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    color: "#F4F7FC",
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  hint: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  error: {
    fontFamily: METRIC_FONT,
    fontSize: 13,
    color: "#FF6B8A",
    textAlign: "center",
  },
  list: { padding: 12, gap: 10 },
  metaCard: {
    borderWidth: 1,
    borderColor: "rgba(245,197,24,0.35)",
    backgroundColor: "rgba(245,197,24,0.06)",
    padding: 10,
    gap: 6,
  },
  metaLine: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    color: "#F5C518",
  },
  metaNote: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,10,14,0.95)",
    padding: 10,
    gap: 8,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  rank: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 18,
    width: 28,
    color: "rgba(255,255,255,0.35)",
  },
  cardTitleCol: { flex: 1, minWidth: 0 },
  abbr: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 18,
    color: "#FFF7E0",
  },
  name: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  overall: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "700",
    color: "#00F5FF",
    textAlign: "right",
  },
  overallPct: {
    fontSize: 11,
    color: "rgba(0,245,255,0.65)",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  aceChip: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    color: "#F5C518",
    borderWidth: 1,
    borderColor: "rgba(245,197,24,0.4)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  keyChip: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    color: "#00F5FF",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  detail: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 4,
  },
  statLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  statValue: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    color: "#E8EEF8",
  },
});
