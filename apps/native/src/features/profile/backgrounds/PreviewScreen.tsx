/**
 * PreviewScreen — Futuristic 背景を実プロフィールカードに当てはめて比較。
 */
import { useState } from "react";
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
import ProfilePlanProBackgroundNative from "../kinetik/ProfilePlanProBackgroundNative";
import { PROFILE_EDIT_KINETIK_MOCK } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import {
  PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS,
  type ProfilePlanProFuturisticBgVariant,
} from "../../../../../../lib/profile/profilePlanProFuturisticBgVariants";
import { FUTURISTIC_BG_THEME as T } from "./theme";

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
    metricsTitle: "WORLD CUP // STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "nba" as const,
    isPro: true,
    canOpenMenu: false,
  };
}

export default function PreviewScreen({ language, onClose }: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState<ProfilePlanProFuturisticBgVariant>(
    PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS[0]!.id,
  );
  const selected =
    PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS.find((e) => e.id === selectedId) ??
    PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS[0]!;
  const cardW = Math.min(360, winW - 32);
  const thumbW = (cardW - 10) / 2;

  return (
    <View style={styles.appRoot}>
      <MobilePageShell
        title="Futuristic BG"
        eyebrow="PRO // PREVIEW"
        subtitle={
          isJa
            ? "実カードに当てはめて 8 種を比較。本番採用リストには未追加。"
            : "Compare 8 variants on the real profile card."
        }
        appBackground
        onClose={onClose}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.pad,
            { paddingBottom: 40 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.meta}>
            {isJa
              ? "Preview only · Futuristic Round 1"
              : "Preview only · Futuristic Round 1"}
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

          <View style={[styles.grid, { width: cardW }]}>
            {PROFILE_PLAN_PRO_FUTURISTIC_BG_VARIANTS.map((entry) => {
              const on = entry.id === selectedId;
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => setSelectedId(entry.id)}
                  style={[
                    styles.tile,
                    { width: thumbW },
                    on && styles.tileOn,
                  ]}
                >
                  <View style={styles.thumb}>
                    <ProfilePlanProBackgroundNative
                      width={thumbW}
                      height={72}
                      animate={false}
                      variant={entry.id}
                      accentReady
                    />
                  </View>
                  <View style={styles.tileFoot}>
                    <Text style={[styles.tileTag, on && styles.tileTagOn]}>
                      {entry.tag}
                    </Text>
                    <Text style={[styles.tileLabel, on && styles.tileLabelOn]}>
                      {entry.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </MobilePageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: T.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: T.background,
  },
  pad: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    alignItems: "center",
  },
  meta: {
    alignSelf: "stretch",
    color: T.cyanAlpha.soft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardWrap: {
    alignSelf: "center",
    marginBottom: 8,
  },
  tag: {
    alignSelf: "stretch",
    color: T.cyanAlpha.soft,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  label: {
    alignSelf: "stretch",
    color: T.white.soft,
    fontSize: 16,
    fontWeight: "700",
  },
  desc: {
    alignSelf: "stretch",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  tileOn: {
    borderColor: "rgba(34,211,238,0.7)",
  },
  thumb: {
    height: 72,
    overflow: "hidden",
    backgroundColor: T.navy,
  },
  tileFoot: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 2,
  },
  tileTag: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tileTagOn: {
    color: T.cyan,
  },
  tileLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  tileLabelOn: {
    color: "#fff",
  },
});
