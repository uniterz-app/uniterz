import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { WC_KNOCKOUT_SEASON } from "../../../../../lib/wc/wc-knockout-bracket";
import type { WcBracketMarketData } from "../../../../../lib/wc/wc-bracket-market-aggregate";
import { teamIdToCountryName } from "../../../../../lib/wc/wcCountry";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";
import { colors, fonts } from "../../theme/tokens";

type WcBracketLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  rank: number;
  alive: boolean;
  survivedRounds: number;
  firstMissMatchId: string | null;
  championPick?: string | null;
};

type WcBracketViewMode = "survivor" | "market";

type Props = {
  language: "ja" | "en";
  season?: string;
};

/** WcBracketLeaderboardSection 相当 */
export default function WcBracketLeaderboardSectionNative({
  language,
  season = WC_KNOCKOUT_SEASON,
}: Props) {
  const isJa = language === "ja";
  const [viewMode, setViewMode] = useState<WcBracketViewMode>("survivor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WcBracketLeaderboardRow[]>([]);
  const [myRow, setMyRow] = useState<WcBracketLeaderboardRow | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [marketLoading, setMarketLoading] = useState(false);
  const [market, setMarket] = useState<WcBracketMarketData | null>(null);

  const fetchRows = useCallback(async () => {
    const base = getUniterzApiBaseUrl();
    if (!base) {
      setError(
        isJa
          ? "API の URL が未設定です"
          : "API base URL is not configured"
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ season, limit: "50", startRank: "1" });
      const uid = auth.currentUser?.uid;
      if (uid) q.set("uid", uid);
      const res = await fetch(`${base}/api/wc-bracket-leaderboard?${q}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        rows?: WcBracketLeaderboardRow[];
        myRow?: WcBracketLeaderboardRow | null;
        totalCount?: number;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "fetch failed");
      }
      setRows(Array.isArray(json.rows) ? json.rows : []);
      setMyRow(json.myRow ?? null);
      setTotalCount(
        typeof json.totalCount === "number" ? json.totalCount : 0
      );
    } catch (e: unknown) {
      setRows([]);
      setMyRow(null);
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  }, [isJa, season]);

  const fetchMarket = useCallback(async () => {
    const base = getUniterzApiBaseUrl();
    if (!base) return;

    setMarketLoading(true);
    try {
      const q = new URLSearchParams({ season });
      const res = await fetch(`${base}/api/wc-bracket-market?${q}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        market?: WcBracketMarketData | null;
      };
      setMarket(json.ok ? (json.market ?? null) : null);
    } catch {
      setMarket(null);
    } finally {
      setMarketLoading(false);
    }
  }, [season]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (viewMode === "market") {
      void fetchMarket();
    }
  }, [viewMode, fetchMarket]);

  const listRows = useMemo(() => {
    if (!myRow) return rows;
    return rows.filter((row) => row.uid !== myRow.uid);
  }, [rows, myRow]);

  const championRows = useMemo(() => {
    if (!market?.championPickCounts) return [];
    const total = market.totalEntries || 1;
    return Object.entries(market.championPickCounts)
      .map(([teamId, count]) => ({
        teamId,
        name:
          teamIdToCountryName(teamId, "en") ??
          teamId.replace(/^wc-/, "").toUpperCase(),
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [market, language]);

  const renderCard = (row: WcBracketLeaderboardRow, highlight = false) => {
    const status = row.alive
      ? isJa
        ? "生存中"
        : "ALIVE"
      : row.firstMissMatchId
        ? isJa
          ? `${row.firstMissMatchId} で脱落`
          : `OUT ${row.firstMissMatchId}`
        : isJa
          ? "脱落"
          : "OUT";

    return (
      <View
        key={row.uid}
        style={[styles.card, highlight && styles.cardMine]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.rank}>
            #{row.rank}
            {totalCount > 0 ? (
              <Text style={styles.rankTotal}> /{totalCount}</Text>
            ) : null}
          </Text>
          {row.championPick ? (
            <Text style={styles.champion}>{row.championPick}</Text>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {row.displayName}
        </Text>
        {row.handle ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{row.handle}
          </Text>
        ) : null}
        <Text style={[styles.status, row.alive && styles.statusAlive]}>
          {status}
        </Text>
        <Text style={styles.rounds}>
          {isJa ? `R${row.survivedRounds}` : `Round ${row.survivedRounds}`}
        </Text>
      </View>
    );
  };

  const viewTabs = (
    <CyberSlantedTabBarNative fill>
      <CyberSlantedTabNative
        label="SURVIVOR"
        active={viewMode === "survivor"}
        fill
        fontWeight="600"
        onPress={() => setViewMode("survivor")}
      />
      <CyberSlantedTabNative
        label="MARKET"
        active={viewMode === "market"}
        fill
        fontWeight="600"
        onPress={() => setViewMode("market")}
      />
    </CyberSlantedTabBarNative>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentCyan} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={() => void fetchRows()} style={styles.retry}>
          <Text style={styles.retryText}>{isJa ? "再試行" : "Retry"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {myRow ? renderCard(myRow, true) : null}
      <View style={styles.tabsWrap}>{viewTabs}</View>

      {viewMode === "survivor" ? (
        <>
          <Text style={styles.subtitle}>
            {isJa
              ? "外れたブラケットから脱落"
              : "Miss a pick, you're out"}
          </Text>
          {listRows.length === 0 && !myRow ? (
            <View style={styles.center}>
              <Text style={styles.noData}>NO DATA</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {listRows.map((row) => renderCard(row))}
            </ScrollView>
          )}
        </>
      ) : marketLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentCyan} />
        </View>
      ) : !market || market.totalEntries === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noData}>NO DATA</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.marketCountLabel}>
            {isJa ? "提出ブラケット" : "SUBMITTED BRACKETS"}
          </Text>
          <Text style={styles.marketCount}>{market.totalEntries}</Text>
          <Text style={styles.marketSection}>
            {isJa ? "優勝予想" : "Champion Predictions"}
          </Text>
          {championRows.map((row, index) => (
            <View key={row.teamId} style={styles.marketRow}>
              <Text style={styles.marketRank}>{index + 1}</Text>
              <Text style={styles.marketName} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={styles.marketMeta}>
                {row.count} · {row.pct}%
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, paddingVertical: 8 },
  tabsWrap: { marginTop: 2 },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  list: { gap: 8, paddingBottom: 8 },
  center: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.glassCardBg,
  },
  cardMine: {
    borderColor: "rgba(34,211,238,0.45)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rank: {
    color: colors.accentCyan,
    fontFamily: fonts.metric,
    fontSize: 18,
    fontWeight: "800",
  },
  rankTotal: { fontSize: 11, color: colors.textMuted },
  champion: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  handle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  status: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },
  statusAlive: { color: colors.accentCyan },
  rounds: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  noData: {
    color: colors.textMuted,
    fontFamily: fonts.metric,
    fontSize: 22,
    letterSpacing: 2,
  },
  error: { color: colors.textSecondary, textAlign: "center", paddingHorizontal: 16 },
  retry: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  retryText: { color: colors.accentCyan, fontWeight: "600" },
  marketCountLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  marketCount: {
    color: colors.accentCyan,
    fontFamily: fonts.metric,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  marketSection: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  marketRank: {
    width: 20,
    color: colors.textMuted,
    fontWeight: "800",
    fontSize: 14,
  },
  marketName: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  marketMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
