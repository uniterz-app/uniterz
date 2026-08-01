/**
 * Web `RankingsDivisionTabs` / `RankingsOpenProLock` 相当
 */

import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RankingDivision } from "../../../../../lib/rankings/rankingDivision";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";

type TabsProps = {
  division: RankingDivision;
  onChange: (next: RankingDivision) => void;
  language: RankingsLanguage;
};

export function RankingsDivisionTabsNative({
  division,
  onChange,
  language,
}: TabsProps) {
  const t = rankingsTexts(language);
  const items: Array<{ id: RankingDivision; label: string }> = [
    { id: "standard", label: t.divisionStandard },
    { id: "open", label: t.divisionOpen },
  ];

  return (
    <View style={styles.tabRow} accessibilityRole="tablist">
      {items.map((item) => {
        const active = division === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.id)}
            style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}
          >
            <Text
              style={[
                styles.tabLabel,
                active ? styles.tabLabelActive : styles.tabLabelIdle,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type LockProps = {
  language: RankingsLanguage;
  onPressSubscribe: () => void;
};

export function RankingsOpenProLockNative({
  language,
  onPressSubscribe,
}: LockProps) {
  const t = rankingsTexts(language);
  return (
    <View style={styles.lockWrap}>
      <Text style={styles.lockEyebrow}>PRO ONLY</Text>
      <Text style={styles.lockTitle}>{t.divisionOpenTitle}</Text>
      <Text style={styles.lockBody}>{t.divisionOpenLockBody}</Text>
      <Pressable
        onPress={onPressSubscribe}
        style={styles.lockCta}
        accessibilityRole="button"
      >
        <Text style={styles.lockCtaLabel}>{t.divisionOpenCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#00F5FF",
  },
  tabIdle: {
    backgroundColor: "transparent",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: "#050508",
  },
  tabLabelIdle: {
    color: "rgba(0,245,255,0.8)",
  },
  lockWrap: {
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
    backgroundColor: "rgba(0,245,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: "center",
  },
  lockEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.4,
    color: "rgba(0,245,255,0.8)",
  },
  lockTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#fff",
    textAlign: "center",
  },
  lockBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  lockCta: {
    marginTop: 18,
    backgroundColor: "#00F5FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lockCtaLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#050508",
  },
});
