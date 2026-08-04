/**
 * Web `RankingListProSkinPreviewPage` 相当 — 採用 Pro Skin × ランキング行
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { CyberRankingListRowNative } from "../../rankings/CyberRankingListRowNative";
import {
  PROFILE_PLAN_PRO_ADOPTED_BG,
  profilePlanProAdoptedCategoryLabel,
} from "../../../../../../lib/profile/profilePlanProAdoptedBgVariants";
import {
  formatProSkinUnlockCondition,
  PRO_SKIN_UNLOCK_CATALOG,
} from "../../../../../../lib/profile/proSkinUnlock";
import { RANKING_SCORE_FONT } from "../../rankings/rankingsUiTheme";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function RankingListProSkinPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.appRoot}>
      <MobilePageShell
        title="RANKING ROW"
        eyebrow="PRO SKIN"
        subtitle={
          isJa
            ? "採用スキンのランキング行一覧。本番と同じ CyberRankingListRow。"
            : "Adopted skins on ranking rows. Same CyberRankingListRow as prod."
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
          <Text style={styles.note}>
            {isJa
              ? "採用カタログ全件を本番と同じランキング行で表示します。"
              : "All adopted skins on production ranking rows."}
          </Text>

          <View style={styles.list}>
            {PRO_SKIN_UNLOCK_CATALOG.map((entry, index) => {
              const adopted = PROFILE_PLAN_PRO_ADOPTED_BG.find(
                (e) => e.id === entry.id
              );
              const category = adopted?.category ?? "cyber";
              return (
                <View key={entry.id} style={styles.section}>
                  <View style={styles.sectionHead}>
                    <View style={styles.sectionTitles}>
                      <Text style={styles.sectionTitle} numberOfLines={1}>
                        <Text style={styles.sectionNo}>
                          No.{String(index + 1).padStart(2, "0")}{" "}
                        </Text>
                        {entry.label}
                      </Text>
                      <Text style={styles.sectionSub} numberOfLines={1}>
                        {profilePlanProAdoptedCategoryLabel(
                          category,
                          isJa ? "ja" : "en"
                        )}{" "}
                        · {formatProSkinUnlockCondition(entry.unlock, language)}
                      </Text>
                    </View>
                    <Text style={styles.sectionId}>{entry.id}</Text>
                  </View>
                  <CyberRankingListRowNative
                    rank={index === 0 ? 1 : Math.min(99, index + 3)}
                    displayName="MPJ"
                    photoURL={null}
                    metric="totalScore"
                    counted={350}
                    posts={71}
                    countryCode="JP"
                    language={language}
                    isPro
                    proSkinVariant={entry.id}
                    proSkinIntensity="medium"
                    scoreSlot={
                      <Text style={styles.scorePreview}>350</Text>
                    }
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </MobilePageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: "#050b14" },
  scroll: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 8 },
  note: {
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.55)",
  },
  list: { gap: 20 },
  section: { gap: 8 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitles: { flex: 1, minWidth: 0 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  sectionNo: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
  sectionSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  sectionId: {
    flexShrink: 0,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.7)",
  },
  scorePreview: {
    fontFamily: RANKING_SCORE_FONT,
    fontSize: 15,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
  },
});
