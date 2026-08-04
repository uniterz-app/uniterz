/**
 * Web `WaveProSkinPreviewPage` 相当 — Wave9 SVG 線画プレビュー
 */
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProfileKinetikPanelNative from "../kinetik/ProfileKinetikPanelNative";
import { PROFILE_EDIT_KINETIK_MOCK } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import {
  PROFILE_PLAN_PRO_WAVE_BG_VARIANTS,
  type ProfilePlanProWaveBgVariant,
} from "../../../../../../lib/profile/profilePlanProWaveBgVariants";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function previewPanelProps(language: "ja" | "en") {
  return {
    language,
    identity: {
      ...PROFILE_EDIT_KINETIK_MOCK.identity,
      displayName: "MPJ",
      systemId: "3PJVG4Y9",
      handle: "mpj",
    },
    stats: {
      ...PROFILE_EDIT_KINETIK_MOCK.stats,
      winRate: 63.4,
      posts: 71,
      hits: 45,
      totalPoints: 350,
      scorePrecision: 8,
      upset: 9,
    },
    winStreak: 0,
    totalPointsRank: 14,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "Win now",
    metricsTitle: "NBA // SEASON STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "nba" as const,
    isPro: true,
    canOpenMenu: false,
    profileViewCount: 1284,
    unitBalance: 2450,
  };
}

export default function WaveProSkinPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const entries = PROFILE_PLAN_PRO_WAVE_BG_VARIANTS;
  const [index, setIndex] = useState(0);
  const selected = useMemo(
    () => entries[index] ?? entries[0]!,
    [entries, index]
  );
  const selectedId = selected.id as ProfilePlanProWaveBgVariant;
  const total = entries.length;
  const cardW = Math.min(360, winW - 32);

  return (
    <View style={styles.appRoot}>
      <MobilePageShell
        title="WAVE 9"
        eyebrow="PRO SKIN // PREVIEW"
        subtitle={
          isJa
            ? "参考テーマの SVG 線画。PNG 直貼りなし。前へ／次へで切替。"
            : "SVG line art from theme refs. Prev / next to switch."
        }
        appBackground
        onClose={onClose}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.pad,
            { paddingBottom: 88 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.meta}>
            Preview only · {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </Text>

          <View style={[styles.cardWrap, { width: cardW }]}>
            <ProfileKinetikPanelNative
              key={selectedId}
              {...previewPanelProps(language)}
              planProBgVariant={selectedId}
            />
          </View>

          <Text style={styles.tag}>{selected.tag}</Text>
          <Text style={styles.label}>{selected.label}</Text>
          <Text style={styles.desc}>{selected.description}</Text>
        </ScrollView>

        <View
          style={[styles.navRow, { paddingBottom: Math.max(12, insets.bottom) }]}
        >
          <Pressable
            onPress={() => setIndex((i) => (i - 1 + total) % total)}
            style={({ pressed }) => [styles.navBtn, pressed && styles.navPressed]}
          >
            <Text style={styles.navText}>← 前へ</Text>
          </Pressable>
          <View style={styles.navCount}>
            <Text style={styles.navCountText}>
              {index + 1}/{total}
            </Text>
          </View>
          <Pressable
            onPress={() => setIndex((i) => (i + 1) % total)}
            style={({ pressed }) => [
              styles.navBtn,
              styles.navBtnAccent,
              pressed && styles.navPressed,
            ]}
          >
            <Text style={[styles.navText, styles.navTextAccent]}>次へ →</Text>
          </Pressable>
        </View>
      </MobilePageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: "#050b14" },
  scroll: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  meta: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.7)",
    marginBottom: 4,
  },
  cardWrap: { alignSelf: "center", marginBottom: 8 },
  tag: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.7)",
  },
  label: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 20,
    color: "rgba(255,255,255,0.95)",
  },
  desc: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(5,11,20,0.92)",
  },
  navBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 12,
    alignItems: "center",
  },
  navBtnAccent: {
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(6,182,212,0.14)",
  },
  navPressed: { opacity: 0.85 },
  navText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
  },
  navTextAccent: { color: "rgba(207,250,254,0.95)" },
  navCount: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navCountText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
  },
});
