/** Web `PeriodRankingUnitRewardsChip` + Modal 相当 */
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CyberHelpMarkNative from "../../ui/CyberHelpMarkNative";
import PredictOverlaySubmitButtonNative from "../games/PredictOverlaySubmitButtonNative";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../games/matchCardTypography";
import {
  defaultPeriodRankingUnitRewardsTab,
  PERIOD_RANKING_UNIT_REWARDS_TABS,
  periodRankingUnitRewardsSections,
  periodRankingUnitRewardsTabLabel,
  periodRankingUnitRewardsUiCopy,
  resolvePeriodRankingUnitRewardsLang,
  type PeriodRankingUnitRewardsLang,
  type PeriodRankingUnitRewardsTab,
} from "../../../../../lib/units/periodRankingUnitRewardsCopy";

type Props = {
  language?: PeriodRankingUnitRewardsLang | string;
  rankingPeriod?: "season" | "weekly" | "monthly" | string | null;
  accessibilityLabel?: string;
  closeLabel?: string;
};

export default function PeriodRankingUnitRewardsSheetNative({
  language: languageProp = "ja",
  rankingPeriod,
  accessibilityLabel,
  closeLabel,
}: Props) {
  const language = resolvePeriodRankingUnitRewardsLang(languageProp);
  const ui = periodRankingUnitRewardsUiCopy(language);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PeriodRankingUnitRewardsTab>(() =>
    defaultPeriodRankingUnitRewardsTab(rankingPeriod)
  );

  useEffect(() => {
    if (!open) return;
    setTab(defaultPeriodRankingUnitRewardsTab(rankingPeriod));
  }, [open, rankingPeriod]);

  const sections = periodRankingUnitRewardsSections(tab, language);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? ui.chipAria}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
        hitSlop={6}
      >
        <Text style={styles.chipLabel}>{ui.chipLabel}</Text>
        <CyberHelpMarkNative active={open} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={closeLabel ?? ui.close}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{ui.titleEn}</Text>
              <Text style={styles.headerHint}>{ui.subtitle}</Text>
            </View>

            <View style={styles.tabRow}>
              {PERIOD_RANKING_UNIT_REWARDS_TABS.map((key) => {
                const active = tab === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setTab(key)}
                    style={[styles.tab, active ? styles.tabActive : null]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        active ? styles.tabLabelActive : null,
                      ]}
                      numberOfLines={1}
                    >
                      {periodRankingUnitRewardsTabLabel(key, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {sections.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.bullets.map((line) => (
                    <Text key={line} style={styles.bullet}>
                      · {line}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
            <View style={styles.footer}>
              <PredictOverlaySubmitButtonNative
                label={closeLabel ?? ui.close}
                enabled
                onPress={() => setOpen(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingLeft: 2,
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  chipLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.8)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  sheet: {
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "#05080c",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 1.4,
    color: "#fff",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  headerHint: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tab: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tabActive: {
    borderColor: "rgba(103,232,249,0.7)",
    backgroundColor: "rgba(34,211,238,0.15)",
  },
  tabLabel: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  tabLabelActive: {
    color: "rgba(207,250,254,1)",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(165,243,252,0.85)",
  },
  bullet: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.75)",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
});
