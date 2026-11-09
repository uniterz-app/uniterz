import { ScrollView, StyleSheet, View } from "react-native";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import { slantedTabWidth } from "./LeagueHubBranchTabsNative";

type TabItem<T extends string> = { id: T; label: string };

/** 斜めタブを横幅いっぱいに等分する */
export function HubSlantedTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <CyberSlantedTabBarNative fill>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <CyberSlantedTabNative
            key={it.id}
            label={it.label}
            active={active}
            onPress={() => onChange(it.id)}
            compact
            fontWeight="700"
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          />
        );
      })}
    </CyberSlantedTabBarNative>
  );
}

/** 斜めタブを横スクロールで並べる（1 行に収まらない数のとき） */
export function HubScrollSlantedTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {items.map((it) => {
        const active = value === it.id;
        return (
          <View key={it.id} style={[styles.slot, { width: slantedTabWidth(it.label) }]}>
            <CyberSlantedTabNative
              label={it.label}
              active={active}
              onPress={() => onChange(it.id)}
              compact
              fill
              fontWeight="700"
              glow="tight"
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    height: 54,
    marginHorizontal: -12,
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  slot: {
    height: 30,
  },
});
