import { useCallback, useEffect, useState } from "react";
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

type Props = {
  language: "ja" | "en";
  season?: string;
};

/** WcBracketLeaderboardSection 相当（サバイバーランキング） */
export default function WcBracketLeaderboardSectionNative({
  language,
  season = WC_KNOCKOUT_SEASON,
}: Props) {
  const isJa = language === "ja";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WcBracketLeaderboardRow[]>([]);
  const [myRow, setMyRow] = useState<WcBracketLeaderboardRow | null>(null);
  const [totalCount, setTotalCount] = useState(0);

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

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

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

  if (rows.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noData}>NO DATA</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>
        {isJa ? "WC ブラケット（サバイバー）" : "WC Bracket (Survivor)"}
      </Text>
      {myRow ? renderCard(myRow, true) : null}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => renderCard(row))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, paddingVertical: 8 },
  title: {
    fontFamily: fonts.metric,
    color: colors.textPrimary,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
});
