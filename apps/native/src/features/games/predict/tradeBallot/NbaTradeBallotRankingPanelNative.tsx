/**
 * トレードバレット ランキング — 行タップでその人のバレットを表示。
 */
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NbaAwardCandidate } from "../../../../../../../lib/predict/nbaTradeBallotPredict";
import type { NbaTradeBallotRankEntry } from "../../../../../../../lib/predict/nbaTradeBallotRankingMocks";
import NbaTradeBallotViewPanelNative from "./NbaTradeBallotViewPanelNative";
import PredictOverlaySubmitButtonNative from "../../PredictOverlaySubmitButtonNative";

type Props = {
  rows: readonly NbaTradeBallotRankEntry[];
  catalog?: readonly NbaAwardCandidate[];
};

const OX = "Oxanium_700Bold";

export default function NbaTradeBallotRankingPanelNative({
  rows,
  catalog,
}: Props) {
  const [selected, setSelected] = useState<NbaTradeBallotRankEntry | null>(
    null
  );

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Trade ballot rank</Text>
      <Text style={styles.lead}>
        タップでバレット表示。1位ユニフォーム · 2〜50位に Unit · 提出完了は参加賞
        5 Unit。
      </Text>

      <View style={{ gap: 6, marginTop: 12 }}>
        {rows.map((row) => (
          <Pressable
            key={row.uid}
            onPress={() => setSelected(row)}
            style={({ pressed }) => [
              styles.row,
              pressed ? styles.rowPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${row.rank}位 ${row.handle}`}
          >
            <Text style={styles.rank}>{row.rank}</Text>
            <View style={styles.main}>
              <Text style={styles.handle} numberOfLines={1}>
                @{row.handle}
              </Text>
              <Text style={styles.meta}>
                {row.playerHits}P · {row.teamHits}T
                {row.jersey
                  ? " · JERSEY"
                  : row.units > 0
                    ? ` · ${row.units}U`
                    : ""}
              </Text>
            </View>
            <Text style={styles.total}>{row.total}</Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={selected != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setSelected(null)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>
                #{selected?.rank} · @{selected?.handle}
              </Text>
              <Text style={styles.sheetScore}>
                {selected?.total ?? 0} pts
              </Text>
            </View>
            <ScrollView
              contentContainerStyle={{ padding: 12, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {selected ? (
                <NbaTradeBallotViewPanelNative
                  prediction={selected.prediction}
                  catalog={catalog}
                />
              ) : null}
            </ScrollView>
            <View style={styles.sheetFooter}>
              <PredictOverlaySubmitButtonNative
                label="閉じる"
                enabled
                onPress={() => setSelected(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "#000000",
    padding: 12,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(253,230,138,0.9)",
    textTransform: "uppercase",
  },
  lead: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  rowPressed: {
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  rank: {
    width: 22,
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(253,230,138,0.9)",
    textAlign: "center",
  },
  main: { flex: 1, minWidth: 0, gap: 2 },
  handle: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  meta: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  total: {
    fontFamily: OX,
    fontSize: 16,
    fontWeight: "900",
    color: "rgba(254,243,199,0.95)",
    fontVariant: ["tabular-nums"],
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  sheet: {
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "#05080c",
    overflow: "hidden",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#fff",
    textTransform: "uppercase",
  },
  sheetScore: {
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(253,230,138,0.95)",
  },
  sheetFooter: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
});
