/**
 * Web `.cyber-filter-bar` 相当
 */
import { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, cyberFilter, fonts } from "../theme/tokens";

type Props = {
  /** 折りたたみ可能な詳細フィルター */
  detailOpen?: boolean;
  onToggleDetail?: () => void;
  /** 左側（outcome 等） */
  primaryFilters?: ReactNode;
  /** 詳細パネル（折りたたみ内） */
  detailFilters?: ReactNode;
  /** フィルターボタン押下（Games 等） */
  onFilterPress?: () => void;
  filterActive?: boolean;
  language?: "ja" | "en";
};

export default function CyberFilterBarNative({
  detailOpen = false,
  onToggleDetail,
  primaryFilters,
  detailFilters,
  onFilterPress,
  filterActive = false,
  language = "ja",
}: Props) {
  const isJa = language === "ja";

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFillObject} />
        )}
        <LinearGradient
          colors={[colors.filterBarBg, "rgba(10,14,24,0.65)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.row}>
          {primaryFilters}
          <View style={styles.spacer} />
          {onToggleDetail ? (
            <Pressable style={styles.iconBtn} onPress={onToggleDetail}>
              <MaterialCommunityIcons
                name={detailOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.iconBtnLabel}>{isJa ? "詳細" : "More"}</Text>
            </Pressable>
          ) : null}
          {onFilterPress ? (
            <Pressable style={[styles.iconBtn, filterActive && styles.iconBtnActive]} onPress={onFilterPress}>
              <MaterialCommunityIcons
                name="tune-variant"
                size={20}
                color={filterActive ? colors.accentCyan : colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      {detailOpen && detailFilters ? (
        <View style={styles.detailPanel}>{detailFilters}</View>
      ) : null}
    </View>
  );
}

/** フィルターチップ */
export function CyberFilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  bar: {
    borderRadius: cyberFilter.barRadius,
    borderWidth: 1,
    borderColor: colors.filterBarBorder,
    overflow: "hidden",
    paddingHorizontal: cyberFilter.barPaddingH,
    paddingVertical: cyberFilter.barPaddingV,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: cyberFilter.chipGap,
    flexWrap: "wrap",
  },
  spacer: { flex: 1 },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  iconBtnActive: {
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  iconBtnLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailPanel: {
    marginTop: 8,
    borderRadius: cyberFilter.panelRadius,
    borderWidth: 1,
    borderColor: colors.filterBarBorder,
    backgroundColor: colors.glassCardBg,
    padding: 12,
    gap: 10,
  },
  chip: {
    paddingHorizontal: cyberFilter.chipPaddingH,
    paddingVertical: cyberFilter.chipPaddingV,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  chipActive: {
    borderColor: colors.accentCyan,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  chipLabel: {
    fontSize: 12,
    fontFamily: fonts.metric,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  chipLabelActive: {
    color: colors.accentCyan,
  },
});
