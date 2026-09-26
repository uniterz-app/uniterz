/**
 * Web 相当なし — DEV 用 Dust Pro Skin プレビュー（Dust / Ash）。
 * Profile サイドメニュー DEV → Dust Pro Skin
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";
import { CyberRankingListRowNative } from "../../rankings/CyberRankingListRowNative";
import { OXANIUM_800 } from "../reports/reportThemeNative";
import { PROFILE_EDIT_KINETIK_MOCK } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import {
  PROFILE_PLAN_PRO_BEAST_BG_ROUND8,
  PROFILE_PLAN_PRO_BEAST_BG_VARIANTS,
  type ProfilePlanProBeastBgVariant,
} from "@/lib/profile/profilePlanProBeastBgVariants";
import { resolveLocalizedLang } from "@/lib/i18n/localize";

type Props = {
  language: string;
  onClose: () => void;
};

function metaFor(id: ProfilePlanProBeastBgVariant) {
  return PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.find((v) => v.id === id)!;
}

function previewPanelProps(
  language: string,
  variant: ProfilePlanProBeastBgVariant
) {
  return {
    language: resolveLocalizedLang(language),
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
      exactHits: 0,
      upset: 9,
    },
    winStreak: 0,
    totalPointsRank: 14,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "",
    metricsTitle: "NBA // 26-27",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "uniterz",
    rankingLeague: "nba" as const,
    isPro: true,
    canOpenMenu: false,
    planProBgVariant: variant,
  };
}

export default function DustProSkinPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);

  return (
    <MobilePageShell
      title="Dust"
      eyebrow="DEV · PRO SKIN ×2"
      subtitle={
        lang === "ja"
          ? "参照写真の素材マップ（Dust / Ash）"
          : "Photo material maps (Dust / Ash)"
      }
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {PROFILE_PLAN_PRO_BEAST_BG_ROUND8.map((id, index) => {
          const meta = metaFor(id);
          return (
            <View key={id} style={index > 0 ? styles.blockSpaced : undefined}>
              <Text style={styles.sectionLabel}>
                {index + 1} · {meta.label.toUpperCase()}
              </Text>
              <View style={styles.cardWrap} pointerEvents="none">
                <ProfileKinetikPanelNative
                  {...previewPanelProps(language, id)}
                />
              </View>
              <View style={styles.rankWrap}>
                <CyberRankingListRowNative
                  rank={3}
                  displayName="UNITERZ"
                  metric="streak"
                  counted={350}
                  posts={71}
                  countryCode="JP"
                  language={lang === "ja" ? "ja" : "en"}
                  isPro
                  proSkinVariant={id}
                  proSkinIntensity="medium"
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 14,
    paddingBottom: 48,
  },
  blockSpaced: {
    marginTop: 28,
  },
  sectionLabel: {
    marginTop: 4,
    marginBottom: 10,
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "rgba(186,154,120,0.85)",
  },
  cardWrap: {
    borderRadius: 2,
    overflow: "hidden",
  },
  rankWrap: {
    marginTop: 10,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(140,112,88,0.22)",
  },
});
