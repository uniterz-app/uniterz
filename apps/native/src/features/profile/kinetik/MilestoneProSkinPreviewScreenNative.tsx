/**
 * Web 相当なし — DEV 用マイルストーン Pro Skin 一覧（解放条件順）。
 * Profile サイドメニュー DEV → Milestone Pro Skin
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import ProfileKinetikPanelNative from "./ProfileKinetikPanelNative";
import ProSkinImageCreditNative from "./ProSkinImageCreditNative";
import { CyberRankingListRowNative } from "../../rankings/CyberRankingListRowNative";
import { OXANIUM_800 } from "../reports/reportThemeNative";
import { PROFILE_EDIT_KINETIK_MOCK } from "../../../../../../app/component/profile/edit/profileEditKinetikTypes";
import type { ProfilePlanProBeastBgVariant } from "@/lib/profile/profilePlanProBeastBgVariants";
import { PROFILE_PLAN_PRO_ADOPTED_BG } from "@/lib/profile/profilePlanProAdoptedBgVariants";
import {
  formatProSkinUnlockCondition,
  PRO_SKIN_UNLOCK_CATALOG,
} from "@/lib/profile/proSkinUnlock";
import { resolveLocalizedLang } from "@/lib/i18n/localize";

type Props = {
  language: string;
  onClose: () => void;
};

function metaFor(id: ProfilePlanProBeastBgVariant) {
  return PROFILE_PLAN_PRO_ADOPTED_BG.find((v) => v.id === id)!;
}

type PreviewEntry = {
  id: ProfilePlanProBeastBgVariant;
  heading: string;
};

function previewEntries(language: string): PreviewEntry[] {
  return PRO_SKIN_UNLOCK_CATALOG.filter((e) => e.unlock.kind !== "pro").map(
    (e) => ({
      id: e.id as ProfilePlanProBeastBgVariant,
      heading: formatProSkinUnlockCondition(e.unlock, language),
    })
  );
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

export default function MilestoneProSkinPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const ja = lang === "ja";
  const entries = previewEntries(lang);

  return (
    <MobilePageShell
      title="Milestone"
      eyebrow={`DEV · MILESTONE ×${entries.length}`}
      subtitle={
        ja
          ? "連勝・パーフェクト・予想数・順位・招待のマイルストーン一覧"
          : "All milestone skins by unlock condition"
      }
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {entries.map(({ id, heading }, index) => {
          const meta = metaFor(id);
          return (
            <View key={id} style={index > 0 ? styles.blockSpaced : undefined}>
              <Text style={styles.milestone}>
                {heading}
              </Text>
              <Text style={styles.sectionLabel}>
                {meta.label.toUpperCase()}
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
  milestone: {
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
