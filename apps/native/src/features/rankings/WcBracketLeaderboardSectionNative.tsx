import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import { WC_KNOCKOUT_SEASON } from "../../../../../lib/wc/wc-knockout-bracket";
import type { WcBracketLeaderboardRow } from "@/lib/leaderboards/useWcBracketLeaderboard";
import type { WcBracketMarketData } from "../../../../../lib/wc/wc-bracket-market-aggregate";
import { teamIdToCountryName } from "../../../../../lib/wc/wcCountry";
import WcBracketDetailOverlayNative from "../games/wc/bracket/WcBracketDetailOverlayNative";
import WcBracketUserCardNative from "../games/wc/bracket/WcBracketUserCardNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "./CyberSlantedTabNative";
import { colors, fonts } from "../../theme/tokens";

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
  const [selectedRow, setSelectedRow] = useState<WcBracketLeaderboardRow | null>(
    null
  );

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
  }, [market]);

  const openDetail = useCallback((row: WcBracketLeaderboardRow) => {
    setSelectedRow(row);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedRow(null);
  }, []);

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
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {myRow ? (
        <WcBracketUserCardNative
          row={myRow}
          language={language}
          onPress={() => openDetail(myRow)}
        />
      ) : null}
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
              {listRows.map((row) => (
                <WcBracketUserCardNative
                  key={row.uid}
                  row={row}
                  language={language}
                  onPress={() => openDetail(row)}
                />
              ))}
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

      <WcBracketDetailOverlayNative
        visible={selectedRow != null}
        row={selectedRow}
        season={season}
        language={language}
        onClose={closeDetail}
      />
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
  noData: {
    color: colors.textMuted,
    fontFamily: fonts.metric,
    fontSize: 22,
    letterSpacing: 2,
  },
  error: { color: colors.textSecondary, textAlign: "center", paddingHorizontal: 16 },
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
