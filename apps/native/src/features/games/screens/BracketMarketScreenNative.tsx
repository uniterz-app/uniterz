import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import { db } from "../../../lib/firebase";
import { colors, radius } from "../../../theme/tokens";
import { getCurrentPlayoffSeason } from "../../../../../../lib/playoff-bracket-config";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import type { GamesStackParamList } from "../../../navigation/types";

type MarketCountMap = Record<string, number>;

type TeamProgressMap = {
  R2: MarketCountMap;
  CF: MarketCountMap;
  FINALS: MarketCountMap;
  CHAMPION: MarketCountMap;
};

type MatchupMarketItem = {
  total: number;
  winnerPickCounts: MarketCountMap;
  gamesPickCounts: MarketCountMap;
};

type MatchupMarketMap = Record<string, MatchupMarketItem>;

type MarketData = {
  season: string;
  totalEntries: number;
  championPickCounts: MarketCountMap;
  round1SeriesMarkets: Record<
    string,
    { winnerPickCounts: MarketCountMap; gamesPickCounts: MarketCountMap }
  >;
  teamProgressMarkets: TeamProgressMap;
  matchupMarkets: {
    R2: MatchupMarketMap;
    CF: MatchupMarketMap;
    FINALS: MatchupMarketMap;
  };
};

type MainTab = "champion" | "advance" | "r1" | "late";
type LateRound = "R2" | "CF" | "FINALS";

function teamLabel(teamId: string): string {
  return NBA_TEAM_NAME_BY_ID[teamId] ?? TEAM_SHORT[teamId] ?? teamId;
}

function percent(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function normalizeMarketData(season: string, raw: Record<string, unknown>): MarketData {
  const d = raw as Partial<MarketData>;
  const teamProgress = d.teamProgressMarkets;
  const matchup = d.matchupMarkets;
  return {
    season: String(d.season ?? season),
    totalEntries: Number(d.totalEntries ?? 0),
    championPickCounts:
      d.championPickCounts && typeof d.championPickCounts === "object" ? d.championPickCounts : {},
    round1SeriesMarkets:
      d.round1SeriesMarkets && typeof d.round1SeriesMarkets === "object"
        ? d.round1SeriesMarkets
        : {},
    teamProgressMarkets: {
      R2: teamProgress?.R2 ?? {},
      CF: teamProgress?.CF ?? {},
      FINALS: teamProgress?.FINALS ?? {},
      CHAMPION: teamProgress?.CHAMPION ?? {},
    },
    matchupMarkets: {
      R2: matchup?.R2 ?? {},
      CF: matchup?.CF ?? {},
      FINALS: matchup?.FINALS ?? {},
    },
  };
}

/** PlayoffBracketMarket のチャンピオン・進出・R1・後半ラウンドを表示 */
export default function BracketMarketScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const season = getCurrentPlayoffSeason();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<MainTab>("champion");
  const [lateRound, setLateRound] = useState<LateRound>("R2");

  useEffect(() => {
    let alive = true;
    void getDoc(doc(db, "playoffBracketMarket", season))
      .then((snap) => {
        if (!alive) return;
        if (!snap.exists()) {
          setMarket(null);
          return;
        }
        setMarket(normalizeMarketData(season, snap.data() as Record<string, unknown>));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [season]);

  const championRows = useMemo(() => {
    if (!market) return [];
    return Object.entries(market.championPickCounts)
      .map(([teamId, count]) => ({
        teamId,
        name: teamLabel(teamId),
        count: Number(count) || 0,
      }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 16);
  }, [market]);

  const progressRows = useMemo(() => {
    if (!market) return [];
    const total = market.totalEntries;
    const teamIds = new Set<string>();
    (["R2", "CF", "FINALS", "CHAMPION"] as const).forEach((stage) => {
      Object.keys(market.teamProgressMarkets[stage] ?? {}).forEach((id) => teamIds.add(id));
    });
    return [...teamIds]
      .map((teamId) => {
        const r2 = Number(market.teamProgressMarkets.R2[teamId] ?? 0);
        const cf = Number(market.teamProgressMarkets.CF[teamId] ?? 0);
        const finals = Number(market.teamProgressMarkets.FINALS[teamId] ?? 0);
        const champion = Number(market.teamProgressMarkets.CHAMPION[teamId] ?? 0);
        const stages = [
          { label: "R2", pct: percent(r2, total) },
          { label: "CF", pct: percent(cf, total) },
          { label: "F", pct: percent(finals, total) },
          { label: "🏆", pct: percent(champion, total) },
        ];
        const best = [...stages].sort((a, b) => b.pct - a.pct)[0]!;
        return {
          teamId,
          name: teamLabel(teamId),
          stages,
          bestLabel: best.label,
          bestPct: best.pct,
        };
      })
      .filter((r) => r.stages.some((s) => s.pct > 0))
      .sort((a, b) => b.bestPct - a.bestPct)
      .slice(0, 20);
  }, [market]);

  const r1Rows = useMemo(() => {
    if (!market) return [];
    return Object.entries(market.round1SeriesMarkets)
      .map(([seriesId, data]) => {
        const counts = data.winnerPickCounts ?? {};
        const entries = Object.values(counts).reduce((s, n) => s + (Number(n) || 0), 0);
        const top = Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
        return {
          seriesId,
          entries,
          topTeamId: top?.[0] ?? "",
          topCount: Number(top?.[1] ?? 0),
        };
      })
      .filter((r) => r.entries > 0)
      .sort((a, b) => b.entries - a.entries);
  }, [market]);

  const lateRows = useMemo(() => {
    if (!market) return [];
    const map = market.matchupMarkets[lateRound] ?? {};
    return Object.entries(map)
      .map(([matchupKey, item]) => {
        const parts = matchupKey.split("|");
        const teamA = parts[1] ?? "";
        const teamB = parts[2] ?? "";
        const total = Number(item.total ?? 0);
        const top = Object.entries(item.winnerPickCounts ?? {}).sort(
          (a, b) => Number(b[1]) - Number(a[1])
        )[0];
        const topPct = total > 0 && top ? Math.round((Number(top[1]) / total) * 100) : 0;
        return {
          matchupKey,
          label: `${teamLabel(teamA)} vs ${teamLabel(teamB)}`,
          total,
          topTeamId: top?.[0] ?? "",
          topPct,
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [market, lateRound]);

  const mainTabs: Array<{ id: MainTab; label: string }> = [
    { id: "champion", label: "Champion" },
    { id: "advance", label: "Advance" },
    { id: "r1", label: "Round 1" },
    { id: "late", label: "R2/CF/F" },
  ];

  return (
    <MobilePageShell title="Bracket Market" onClose={() => navigation.goBack()}>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : !market ? (
        <Text style={styles.empty}>NO DATA</Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {mainTabs.map(({ id, label }) => (
              <Pressable
                key={id}
                style={[styles.tabChip, tab === id && styles.tabChipActive]}
                onPress={() => setTab(id)}
              >
                <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.meta}>
            {market.season} · {market.totalEntries} entries
          </Text>
          {tab === "late" ? (
            <View style={styles.subTabs}>
              {(["R2", "CF", "FINALS"] as const).map((round) => (
                <Pressable
                  key={round}
                  style={[styles.subTabChip, lateRound === round && styles.subTabChipActive]}
                  onPress={() => setLateRound(round)}
                >
                  <Text
                    style={[
                      styles.subTabLabel,
                      lateRound === round && styles.subTabLabelActive,
                    ]}
                  >
                    {round === "FINALS" ? "Finals" : round}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <ScrollView contentContainerStyle={styles.content}>
            {tab === "champion" ? (
              championRows.length === 0 ? (
                <Text style={styles.empty}>No champion picks yet</Text>
              ) : (
                championRows.map((row, index) => {
                  const pct =
                    market.totalEntries > 0
                      ? ((100 * row.count) / market.totalEntries).toFixed(1)
                      : "0.0";
                  return (
                    <View key={row.teamId} style={styles.row}>
                      <Text style={styles.rank}>{index + 1}</Text>
                      <Text style={styles.name} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text style={styles.pct}>{pct}%</Text>
                    </View>
                  );
                })
              )
            ) : null}

            {tab === "advance" ? (
              progressRows.length === 0 ? (
                <Text style={styles.empty}>No advancement data</Text>
              ) : (
                progressRows.map((row) => (
                  <View key={row.teamId} style={styles.progressRow}>
                    <View style={styles.progressHead}>
                      <Text style={styles.name} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text style={styles.pct}>
                        {row.bestLabel} {row.bestPct}%
                      </Text>
                    </View>
                    <View style={styles.stageRow}>
                      {row.stages.map((stage) => (
                        <View key={stage.label} style={styles.stageChip}>
                          <Text style={styles.stageLabel}>{stage.label}</Text>
                          <Text style={styles.stagePct}>{stage.pct}%</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )
            ) : null}

            {tab === "r1" ? (
              r1Rows.length === 0 ? (
                <Text style={styles.empty}>No Round 1 market data</Text>
              ) : (
                r1Rows.map((row) => {
                  const pct =
                    row.entries > 0 ? Math.round((100 * row.topCount) / row.entries) : 0;
                  return (
                    <View key={row.seriesId} style={styles.row}>
                      <Text style={styles.seriesId}>{row.seriesId}</Text>
                      <Text style={styles.name} numberOfLines={1}>
                        {row.topTeamId ? teamLabel(row.topTeamId) : "—"} ({pct}%)
                      </Text>
                      <Text style={styles.pct}>{row.entries}</Text>
                    </View>
                  );
                })
              )
            ) : null}

            {tab === "late" ? (
              lateRows.length === 0 ? (
                <Text style={styles.empty}>No {lateRound} matchup data</Text>
              ) : (
                lateRows.map((row) => (
                  <View key={row.matchupKey} style={styles.row}>
                    <Text style={styles.name} numberOfLines={2}>
                      {row.label}
                    </Text>
                    <Text style={styles.pct} numberOfLines={1}>
                      {row.topTeamId ? teamLabel(row.topTeamId) : "—"} {row.topPct}%
                    </Text>
                    <Text style={styles.entries}>{row.total}</Text>
                  </View>
                ))
              )
            ) : null}
          </ScrollView>
        </>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tabChipActive: {
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tabLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  tabLabelActive: { color: colors.textPrimary },
  subTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  subTabChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  subTabChipActive: {
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  subTabLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  subTabLabelActive: { color: colors.textPrimary },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  meta: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 16, marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
  },
  progressRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
    gap: 8,
  },
  progressHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  stageChip: {
    minWidth: 52,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  stageLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  stagePct: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  rank: { width: 24, color: colors.textMuted, fontWeight: "800" },
  seriesId: { width: 72, color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  name: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  pct: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
  entries: { color: colors.textMuted, fontSize: 12, fontWeight: "700", minWidth: 28, textAlign: "right" },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
  },
});
