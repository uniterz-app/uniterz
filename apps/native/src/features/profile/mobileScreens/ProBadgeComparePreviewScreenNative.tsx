/**
 * Web `/dev/pro-badge-compare` 相当 — 現行 vs 旧 Pro バッジ比較。
 */
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UniterzProBadgeNative from "../../units/UniterzProBadgeNative";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import ProCyberBadgeLegacyNative from "../kinetik/ProCyberBadgeLegacyNative";
import { CyberRankingListRowNative } from "../../rankings/CyberRankingListRowNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

type BadgeKind = "current" | "legacy";

const MOCK_ROWS: Array<{
  rank: number;
  displayName: string;
  points: number;
  posts: number;
  isPro: boolean;
  countryCode: string;
}> = [
  {
    rank: 1,
    displayName: "KAMIYA",
    points: 12840,
    posts: 42,
    isPro: true,
    countryCode: "JP",
  },
  {
    rank: 2,
    displayName: "RIKU",
    points: 11210,
    posts: 38,
    isPro: true,
    countryCode: "JP",
  },
  {
    rank: 3,
    displayName: "NOVA",
    points: 9980,
    posts: 35,
    isPro: false,
    countryCode: "US",
  },
  {
    rank: 4,
    displayName: "SHADOW",
    points: 8740,
    posts: 31,
    isPro: true,
    countryCode: "KR",
  },
  {
    rank: 5,
    displayName: "FREE_PLAYER",
    points: 7600,
    posts: 28,
    isPro: false,
    countryCode: "JP",
  },
];

function Caption({ children }: { children: string }) {
  return <Text style={styles.caption}>{children}</Text>;
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {hint ? <Text style={styles.panelHint}>{hint}</Text> : null}
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function NameWithBadge({
  kind,
  size,
}: {
  kind: BadgeKind;
  size: "premium" | "emphasized" | "compact";
}) {
  const Badge =
    kind === "current" ? ProCyberBadgeNative : ProCyberBadgeLegacyNative;
  const textStyle =
    size === "premium"
      ? styles.nameLg
      : size === "emphasized"
        ? styles.nameMd
        : styles.nameSm;
  return (
    <View style={styles.nameRow}>
      <Text style={textStyle}>KAMIYA</Text>
      <Badge
        premium={size === "premium"}
        emphasized={size === "emphasized"}
        compact={size === "compact"}
      />
    </View>
  );
}

function RankingListSample({
  kind,
  language,
}: {
  kind: BadgeKind;
  language: "ja" | "en";
}) {
  return (
    <View>
      {MOCK_ROWS.map((row) => (
        <CyberRankingListRowNative
          key={`${kind}-${row.rank}`}
          rank={row.rank}
          displayName={row.displayName}
          photoURL={null}
          metric="totalScore"
          counted={row.points}
          posts={row.posts}
          countryCode={row.countryCode}
          language={language}
          reduceMotion
          nameExtra={
            row.isPro ? (
              kind === "current" ? (
                <ProCyberBadgeNative compact />
              ) : (
                <ProCyberBadgeLegacyNative compact />
              )
            ) : null
          }
        />
      ))}
    </View>
  );
}

export default function ProBadgeComparePreviewScreenNative({
  language,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const ja = language === "ja";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        style={styles.back}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <Text style={styles.eyebrow}>Dev preview</Text>
        <Text style={styles.title}>Pro badge compare</Text>
        <Text style={styles.lead}>
          {ja
            ? "上が今（UNITERZ PRO タグ）、下が前（ダイヤモンド + PRO）。ランキングリストの載り方も並べて確認できます。"
            : "Top = current UNITERZ PRO tag. Bottom = previous diamond + PRO. Ranking list placement included."}
        </Text>

        <Panel title="Now — large" hint="UniterzProBadge gold">
          <View style={styles.center}>
            <UniterzProBadgeNative height={72} tone="gold" />
          </View>
        </Panel>

        <Panel title="Previous — large" hint="Diamond mark + PRO word">
          <View style={[styles.center, { transform: [{ scale: 2.2 }] }]}>
            <ProCyberBadgeLegacyNative premium />
          </View>
        </Panel>

        <Panel title="Now — on name">
          <Caption>premium</Caption>
          <NameWithBadge kind="current" size="premium" />
          <Caption>emphasized</Caption>
          <NameWithBadge kind="current" size="emphasized" />
          <Caption>compact</Caption>
          <NameWithBadge kind="current" size="compact" />
        </Panel>

        <Panel title="Previous — on name">
          <Caption>premium</Caption>
          <NameWithBadge kind="legacy" size="premium" />
          <Caption>emphasized</Caption>
          <NameWithBadge kind="legacy" size="emphasized" />
          <Caption>compact</Caption>
          <NameWithBadge kind="legacy" size="compact" />
        </Panel>

        <Panel
          title="Now — ranking list"
          hint={
            ja
              ? "本番と同じリスト行 + 現行バッジ"
              : "Production list row + current badge"
          }
        >
          <RankingListSample kind="current" language={language} />
        </Panel>

        <Panel
          title="Previous — ranking list"
          hint={
            ja
              ? "同じリスト行に旧バッジを載せた場合"
              : "Same list rows with legacy badge"
          }
        >
          <RankingListSample kind="legacy" language={language} />
        </Panel>

        <Text style={styles.note}>
          {ja
            ? "旧バッジは ProCyberBadgeLegacyNative（比較専用）。本番は ProCyberBadgeNative。"
            : "Legacy is ProCyberBadgeLegacyNative (preview only). Production uses ProCyberBadgeNative."}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#03070b" },
  back: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  eyebrow: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  lead: {
    marginTop: 8,
    marginBottom: 16,
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  panelTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  panelHint: {
    marginTop: 4,
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    lineHeight: 17,
  },
  panelBody: { marginTop: 12 },
  caption: {
    marginTop: 10,
    marginBottom: 6,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  nameLg: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    fontStyle: "italic",
  },
  nameMd: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontStyle: "italic",
  },
  nameSm: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "italic",
  },
  note: {
    marginTop: 8,
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    lineHeight: 16,
  },
});
