/**
 * Web 相当なし — DEV 用 Pro Skin 新規追加分（パーフェクト 3 / 10）。
 * Profile サイドメニュー DEV → Candidate Pro Skin
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";
import ProSkinImageCreditNative from "./ProSkinImageCreditNative";
import { CyberRankingListRowNative } from "../../rankings/CyberRankingListRowNative";
import { OXANIUM_800 } from "../reports/reportThemeNative";
import { PROFILE_EDIT_KINETIK_MOCK } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import {
  PROFILE_PLAN_PRO_BEAST_BG_ROUND12,
  PROFILE_PLAN_PRO_BEAST_BG_VARIANTS,
  type ProfilePlanProBeastBgVariant,
} from "@/lib/profile/profilePlanProBeastBgVariants";
import { resolveLocalizedLang } from "@/lib/i18n/localize";

type Props = {
  language: string;
  onClose: () => void;
};

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

export default function CandidateProSkinPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const ja = lang === "ja";

  return (
    <MobilePageShell
      title="Candidate"
      eyebrow={`DEV · CANDIDATE ×${PROFILE_PLAN_PRO_BEAST_BG_ROUND12.length}`}
      subtitle={ja ? "新スキン: パーフェクト 3 回 Shoals / 10 回 Uranus" : "New skins: Perfect 3 Shoals / 10 Uranus"}
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {PROFILE_PLAN_PRO_BEAST_BG_ROUND12.map((id, index) => {
          const meta = PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.find((v) => v.id === id)!;
          return (
            <View key={id} style={index > 0 ? styles.blockSpaced : undefined}>
              <Text style={styles.heading}>{meta.tag}</Text>
              <Text style={styles.sectionLabel}>
                {meta.label.toUpperCase()} · {meta.description}
              </Text>
              <View style={styles.cardWrap} pointerEvents="none">
                <ProfileKinetikPanelNative {...previewPanelProps(language, id)} />
              </View>
              <View style={styles.rankWrap}>
                <CyberRankingListRowNative
                  rank={3}
                  displayName="UNITERZ"
                  metric="streak"
                  counted={350}
                  posts={71}
                  countryCode="JP"
                  language={ja ? "ja" : "en"}
                  isPro
                  proSkinVariant={id}
                  proSkinIntensity="medium"
                />
              </View>
              <ProSkinImageCreditNative
                variant={id}
                language={lang}
                style={styles.credit}
              />
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
    marginTop: 32,
  },
  heading: {
    marginTop: 4,
    fontFamily: OXANIUM_800,
    fontSize: 15,
    letterSpacing: 1.2,
    color: "#00F5FF",
  },
  sectionLabel: {
    marginTop: 2,
    marginBottom: 10,
    fontFamily: OXANIUM_800,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.6)",
  },
  cardWrap: {
    borderRadius: 2,
    overflow: "hidden",
  },
  credit: {
    marginTop: 6,
  },
  rankWrap: {
    marginTop: 10,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
});
