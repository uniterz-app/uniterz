/**
 * Web `/dev/streak-frame-preview` 相当 — 連勝枠の光（1位エッジ vs conic）比較。
 * Profile サイドメニュー DEV → 連勝フレーム光
 */
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { RankFirstBorderEdgeScanNative } from "./RankFirstBorderEdgeScanNative";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import ResultCyberFrameBorderSweepNative from "../results/ResultCyberFrameBorderSweepNative";
import { RANK_FIRST_EDGE_DIM_BORDER } from "../../../../../lib/rankings/rankFirstBorderEdgeScan";
import { OXANIUM_700, OXANIUM_800 } from "../profile/reports/reportThemeNative";

type FxMode = "none" | "conic" | "edge";

type Props = {
  language: string;
  onClose: () => void;
};

function DemoCard({
  label,
  note,
  streak,
  fx,
}: {
  label: string;
  note: string;
  streak: number;
  fx: FxMode;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const edgeBorder =
    fx === "edge" ? RANK_FIRST_EDGE_DIM_BORDER : "rgba(255,255,255,0.12)";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionNote}>{note}</Text>
      <View
        style={[styles.card, { borderColor: edgeBorder }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== size.w || height !== size.h) {
            setSize({ w: width, h: height });
          }
        }}
      >
        {fx === "edge" ? <RankFirstBorderEdgeScanNative /> : null}
        {fx === "conic" && size.w > 0 && size.h > 0 ? (
          <ResultCyberFrameBorderSweepNative
            width={size.w}
            height={size.h}
            variant="default"
            clipShape="chamfer"
            cut={0}
          />
        ) : null}

        <View style={styles.cardInner}>
          <View
            style={[
              styles.streakBadge,
              streak >= 5 ? styles.streakBadgeHot : null,
            ]}
          >
            <Text
              style={[
                styles.streakBadgeText,
                streak >= 5 ? styles.streakBadgeTextHot : null,
              ]}
            >
              {streak}W
            </Text>
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardOverline}>Win streak · demo</Text>
            <Text style={styles.cardTitle}>
              {streak >= 5 ? "Hot run" : streak >= 3 ? "Building" : "Quiet"}
            </Text>
          </View>
          <Text style={styles.fxTag}>fx: {fx}</Text>
        </View>
      </View>
    </View>
  );
}

export default function StreakFramePreviewScreenNative({
  language: _language,
  onClose,
}: Props) {
  const [streak, setStreak] = useState(5);
  const steps = useMemo(() => [0, 3, 4, 5, 6, 7, 10], []);
  const edgeOn = streak >= 5;
  const conicOn = streak >= 3;

  return (
    <MobilePageShell
      title="連勝フレーム光"
      eyebrow="DEV"
      subtitle="採用: B conic。7連勝から光 / 10 金。チップで連勝数を切替。"
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chipRow}>
          {steps.map((n) => {
            const on = n === streak;
            return (
              <Pressable
                key={n}
                onPress={() => setStreak(n)}
                style={[styles.chip, on ? styles.chipOn : null]}
              >
                <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                  {n}W
                </Text>
              </Pressable>
            );
          })}
        </View>

        <DemoCard
          label="A · Reference — Rank #1 edge"
          note="ランキング1位の枠一周光（RankFirstBorderEdgeScanNative）"
          streak={streak}
          fx="edge"
        />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>A2 · Real list row #1</Text>
          <View style={styles.listWrap}>
            <CyberRankingListRowNative
              rank={1}
              displayName="ACE PLAYER"
              metric="streak"
              counted={Math.max(streak, 1)}
              language="ja"
              scoreSlot={
                <Text style={styles.score}>
                  {Math.max(streak, 1)}
                </Text>
              }
              compact
            />
          </View>
        </View>

        <DemoCard
          label="B · Current — My Rank conic sweep"
          note={`いまの My Rank 系 conic（3W〜）。${conicOn ? "ON" : "OFF"} @ ${streak}W`}
          streak={streak}
          fx={conicOn ? "conic" : "none"}
        />

        <DemoCard
          label="C · Proposed — edge from 5W"
          note={`1位と同じエッジ光を 5連勝〜。${edgeOn ? "ON" : "OFF"} @ ${streak}W`}
          streak={streak}
          fx={edgeOn ? "edge" : "none"}
        />

        <DemoCard
          label="D · Hybrid — conic 3–4 / edge 5+"
          note={
            streak >= 5
              ? "5+: edge（格上げ）"
              : streak >= 3
                ? "3–4: conic（現行）"
                : "0–2: なし"
          }
          streak={streak}
          fx={streak >= 5 ? "edge" : streak >= 3 ? "conic" : "none"}
        />

        <View style={styles.notes}>
          <Text style={styles.notesTitle}>所見</Text>
          <Text style={styles.notesBody}>
            · 5連勝は Result platinum 帯と揃う{"\n"}
            · My Rank は 3W から conic があるので 5+ は edge に切替がきれい{"\n"}
            · リスト全体より My Rank / 自分の連勝枠限定が安全
          </Text>
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
    paddingBottom: 48,
    paddingTop: 8,
    gap: 18,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipOn: {
    borderColor: "rgba(34,211,238,0.55)",
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  chipText: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  chipTextOn: {
    color: "#a5f3fc",
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
  },
  sectionNote: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.45)",
  },
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 2,
    borderWidth: 1,
    backgroundColor: "#05080c",
    minHeight: 88,
  },
  cardInner: {
    position: "relative",
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  streakBadge: {
    width: 44,
    height: 44,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadgeHot: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  streakBadgeText: {
    fontFamily: OXANIUM_800,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  streakBadgeTextHot: {
    color: "#67e8f9",
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardOverline: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  cardTitle: {
    marginTop: 2,
    fontFamily: OXANIUM_800,
    fontSize: 15,
    letterSpacing: 0.8,
    color: "#fff",
    textTransform: "uppercase",
  },
  fxTag: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  listWrap: {
    overflow: "hidden",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  score: {
    fontFamily: OXANIUM_800,
    fontSize: 22,
    color: "#FFD65A",
  },
  notes: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesTitle: {
    fontFamily: OXANIUM_700,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
  },
  notesBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
  },
});
