/**
 * Web プロフィール「ブラケット」タブ相当（Firestore の提出ブラケット + 公式結果）。
 */
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getCurrentPlayoffSeason } from "../../../../../lib/playoff-bracket-config";
import { PLAYOFF_SERIES, type SeriesId } from "../../../../../lib/playoff-bracket";
import type { Bracket } from "../../../../../lib/score-playoff-bracket";
import { TEAM_NAME_BY_ID } from "../../../../../lib/team-name-by-id";

type BracketDoc = {
  season?: string;
  bracket?: Partial<Record<SeriesId, { winner?: string; games?: number }>>;
  totalScore?: number;
};

function docId(uid: string, season: string) {
  return `${season}_${uid}`;
}

type Props = {
  uid: string | undefined;
  language: "ja" | "en";
};

export default function ProfileBracketTabNative({ uid, language }: Props) {
  const isJa = language === "ja";
  const [loading, setLoading] = useState(true);
  const [bracketDoc, setBracketDoc] = useState<BracketDoc | null>(null);
  const [results, setResults] = useState<Bracket | null>(null);
  const season = getCurrentPlayoffSeason();

  useEffect(() => {
    if (!season) {
      setResults(null);
      return;
    }
    const ref = doc(db, "playoffResults", season);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setResults(null);
        return;
      }
      const data = snap.data() as { results?: Bracket };
      setResults(data.results ?? {});
    });
    return () => unsub();
  }, [season]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!uid) {
        setBracketDoc(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const ref = doc(db, "playoffBrackets", docId(uid, season));
        const snap = await getDoc(ref);
        if (cancelled) return;
        setBracketDoc(snap.exists() ? (snap.data() as BracketDoc) : null);
      } catch {
        if (!cancelled) setBracketDoc(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, season]);

  if (!uid) {
    return <Text style={styles.muted}>{isJa ? "ログインが必要です" : "Sign in required"}</Text>;
  }

  if (loading) {
    return (
      <View style={styles.loadingBlock}>
        <BlocksPulseLoader pixelScale={0.9} />
      </View>
    );
  }

  if (!bracketDoc?.bracket) {
    return (
      <View style={styles.noDataBox}>
        <Text style={styles.noDataBebas}>NO DATA</Text>
        <Text style={styles.muted}>
          {isJa ? "提出済みのプレーオフブラケットがありません" : "No playoff bracket submitted"}
        </Text>
      </View>
    );
  }

  const b = bracketDoc.bracket;
  const score = bracketDoc.totalScore ?? 0;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>
        {isJa ? "シーズン" : "Season"}: {bracketDoc.season ?? season}
      </Text>
      <Text style={styles.header}>
        {isJa ? "スコア" : "Score"}: {String(score)}
      </Text>
      <View style={styles.divider} />
      {PLAYOFF_SERIES.map((sid) => {
        const pick = b[sid];
        const res = results?.[sid];
        const w = pick?.winner ?? "";
        const g = pick?.games;
        const label = TEAM_NAME_BY_ID[w.toLowerCase()] ?? w;
        return (
          <View key={sid} style={styles.row}>
            <Text style={styles.seriesId}>{sid}</Text>
            <Text style={styles.pick}>
              {w
                ? `${label} (${g ?? "—"}${isJa ? "試合" : " games"})`
                : "—"}
            </Text>
            {res?.winner ? (
              <Text style={styles.official}>
                {isJa ? "公式: " : "Official: "}
                {TEAM_NAME_BY_ID[String(res.winner).toLowerCase()] ?? res.winner} ({res.games})
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 520 },
  loadingBlock: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  muted: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 14,
    paddingVertical: 16,
  },
  noDataBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(5,8,20,0.55)",
    alignItems: "center",
  },
  noDataBebas: {
    fontSize: 32,
    letterSpacing: 4,
    color: "rgba(103,232,249,0.55)",
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "BebasNeue_400Regular",
      android: "BebasNeue_400Regular",
      default: "sans-serif",
    }),
  },
  header: {
    color: "rgba(248,250,252,0.92)",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  seriesId: {
    color: "rgba(103,232,249,0.85)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  pick: { color: "rgba(248,250,252,0.92)", fontSize: 14 },
  official: { color: "rgba(163,230,53,0.85)", fontSize: 12, marginTop: 4 },
});
