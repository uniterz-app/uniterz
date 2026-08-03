/**
 * Web `/dev/pro-skin-title-preview` 相当
 * — 月間総合1位（金冠）/ UPSET（雷）/ 最多得点者（照準・切子）候補比較
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
  PROFILE_PLAN_PRO_BEAST_BG_ROUND7,
  PROFILE_PLAN_PRO_BEAST_BG_VARIANTS,
  type ProfilePlanProBeastBgVariant,
} from "../../../../../../lib/profile/profilePlanProBeastBgVariants";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

const ROLE_BY_ID: Partial<
  Record<ProfilePlanProBeastBgVariant, string>
> = {
  "beast-regalia": "月間総合 1位 · 採用",
  "beast-thunder": "月間 UPSET 1位 · 採用",
  "beast-reticle": "未採用 · 照準",
  "beast-facet": "最多得点者 1位 · 採用",
  "beast-shard": "称号コレクション · 採用",
  "beast-tessera": "新候補 · 三角切面",
  "beast-starborne": "週間最多得点者 1位 · 採用",
  "beast-crown": "既存参考 · Crown",
  "beast-constellation": "既存参考 · Constellation",
};

function metaFor(id: ProfilePlanProBeastBgVariant) {
  return PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.find((v) => v.id === id)!;
}

function previewPanelProps(language: "ja" | "en") {
  return {
    language,
    identity: {
      ...PROFILE_EDIT_KINETIK_MOCK.identity,
      displayName: "UNITERZ",
      systemId: "3PJVG4Y9",
      handle: "uniterz",
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
    totalPointsRank: 1,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "PREVIEW",
    metricsTitle: "NBA // SEASON STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "uniterz",
    rankingLeague: "nba" as const,
    isPro: true,
    canOpenMenu: false,
  };
}

export default function TitleSkinPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const [selectedId, setSelectedId] =
    useState<ProfilePlanProBeastBgVariant>("beast-regalia");
  const selected = metaFor(selectedId);
  const role = ROLE_BY_ID[selectedId];
  const cardW = Math.min(360, winW - 32);
  const thumbW = (cardW - 10) / 2;

  return (
    <View style={styles.appRoot}>
      <MobilePageShell
        title="Title Skins"
        eyebrow="PRO // TITLE PREVIEW"
        subtitle={
          isJa
            ? "金冠 / 雷 / 星の称号スキン候補。本番カタログには未追加。"
            : "Crown / thunder / star title skin candidates. Not in production catalog yet."
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
              ? "Preview only · Title Round 7"
              : "Preview only · Title Round 7"}
          </Text>

          <View style={[styles.cardWrap, { width: cardW }]}>
            <ProfileKinetikPanelNative
              key={selectedId}
              {...previewPanelProps(language)}
              planProBgVariant={selectedId}
            />
          </View>

          {role ? <Text style={styles.role}>{role}</Text> : null}
          <Text style={styles.tag}>{selected.tag}</Text>
          <Text style={styles.label}>{selected.label}</Text>
          <Text style={styles.desc}>{selected.description}</Text>
          <Text style={styles.idCode}>{selected.id}</Text>

          <View style={[styles.grid, { width: cardW }]}>
            {PROFILE_PLAN_PRO_BEAST_BG_ROUND7.map((id) => {
              const entry = metaFor(id);
              const on = id === selectedId;
              const chip = ROLE_BY_ID[id];
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedId(id)}
                  style={[styles.tile, { width: thumbW }, on && styles.tileOn]}
                >
                  <View style={styles.thumb}>
                    <ProfilePlanProBackgroundNative
                      width={thumbW}
                      height={72}
                      animate={false}
                      variant={id}
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
                    {chip ? (
                      <Text style={[styles.tileRole, on && styles.tileRoleOn]}>
                        {chip}
                      </Text>
                    ) : null}
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
    backgroundColor: "#050508",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#050508",
  },
  pad: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    alignItems: "center",
  },
  meta: {
    alignSelf: "stretch",
    color: "rgba(252,211,77,0.7)",
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
  role: {
    alignSelf: "stretch",
    color: "rgba(252,211,77,0.85)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  tag: {
    alignSelf: "stretch",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  label: {
    alignSelf: "stretch",
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    fontWeight: "700",
  },
  desc: {
    alignSelf: "stretch",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 18,
  },
  idCode: {
    alignSelf: "stretch",
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
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
    borderColor: "rgba(251,191,36,0.75)",
  },
  thumb: {
    height: 72,
    overflow: "hidden",
    backgroundColor: "#060809",
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
    color: "rgba(252,211,77,0.95)",
  },
  tileLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  tileLabelOn: {
    color: "#fff",
  },
  tileRole: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },
  tileRoleOn: {
    color: CYBER_TAB_CYAN,
  },
});
