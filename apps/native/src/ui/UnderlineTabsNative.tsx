/**
 * Web `UnderlineTabs` 相当 — 下線インジケータ付きタブ
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, underlineTabs } from "../theme/tokens";

export type UnderlineTabItem<T extends string = string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  items: UnderlineTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  /** split スタイル（2列均等） */
  split?: boolean;
};

export default function UnderlineTabsNative<T extends string>({
  items,
  activeId,
  onChange,
  split = false,
}: Props<T>) {
  return (
    <View style={[styles.row, split && styles.rowSplit]}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            style={[styles.tab, split && styles.tabSplit, active && styles.tabActive]}
            onPress={() => onChange(item.id)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            {active ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderGlass,
  },
  rowSplit: {
    gap: 0,
  },
  tab: {
    height: underlineTabs.height,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabSplit: {
    flex: 1,
  },
  tabActive: {},
  label: {
    fontSize: 14,
    fontFamily: fonts.metric,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  labelActive: {
    color: colors.textPrimary,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: underlineTabs.indicatorHeight,
    backgroundColor: underlineTabs.indicatorColor,
    borderRadius: 1,
  },
});
