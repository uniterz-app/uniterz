import { StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  parseGamePointsDistributionV1,
  rawPointsDistributionFromGameDoc,
} from "../../../../../lib/results/gamePointsDistribution";
import { colors, radius } from "../../theme/tokens";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";

type Props = {
  gameId: string;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  isSoccer: boolean;
  language: GamesLanguage;
  t: GamesTexts;
  myScore?: number | null;
};

function fmt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return (Math.round(n * 10) / 10).toFixed(1);
}

/** Web `GamePredictionDistribution` 相当 — 平均/中央値/最高/自分（posts 全読なし） */
export default function GameMarketDistributionNative({
  gameId,
  language,
  myScore = null,
}: Props) {
  const [ready, setReady] = useState(false);
  const [mean, setMean] = useState<number | null>(null);
  const [median, setMedian] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void (async () => {
      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (cancelled) return;
        const dist = parseGamePointsDistributionV1(
          rawPointsDistributionFromGameDoc(
            snap.exists() ? (snap.data() as Record<string, unknown>) : null
          )
        );
        setMean(dist?.mean ?? null);
        setMedian(dist?.median ?? null);
        setMax(
          typeof dist?.max === "number" && Number.isFinite(dist.max)
            ? dist.max
            : null
        );
        setN(dist?.n ?? 0);
      } catch {
        if (!cancelled) {
          setMean(null);
          setMedian(null);
          setMax(null);
          setN(0);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const labels =
    language === "ja"
      ? {
          title: "得点サマリー",
          mean: "平均",
          median: "中央値",
          max: "最高",
          mine: "自分",
          pending: "試合確定後に表示",
        }
      : {
          title: "Points summary",
          mean: "Avg",
          median: "Median",
          max: "Max",
          mine: "You",
          pending: "Available after final",
        };

  const hasData = n > 0 && (mean != null || median != null);
  const cells = [
    { label: labels.mean, value: mean },
    { label: labels.median, value: median },
    { label: labels.max, value: max },
    { label: labels.mine, value: myScore },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{labels.title}</Text>
      {!ready ? (
        <Text style={styles.muted}>…</Text>
      ) : !hasData ? (
        <Text style={styles.muted}>{labels.pending}</Text>
      ) : (
        <View style={styles.row}>
          {cells.map((c) => (
            <View key={c.label} style={styles.cell}>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={styles.value}>{fmt(c.value)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  title: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  cell: { flex: 1, alignItems: "center" },
  label: { color: "rgba(255,255,255,0.55)", fontSize: 10 },
  value: {
    marginTop: 2,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  muted: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 8,
  },
});
