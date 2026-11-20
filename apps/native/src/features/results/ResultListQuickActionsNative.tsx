/**
 * リザルト一覧のショートカット。
 * 今日の最初の試合へ飛ぶ / PICK UP だけ表示。
 * 日付帯と同じ細い帯。選んでいる PICK UP だけ文字がシアン。
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PANEL_BG } from "../profile/reports/reportThemeNative";

const ACCENT = "#00F5FF";
const LABEL = "rgba(236,254,255,0.92)";

type Props = {
  jumpLabel: string;
  jumpAccessibilityLabel: string;
  jumpDisabled: boolean;
  onJump: () => void;
  /** Free は PICK UP 固定なので切替を出さない */
  showPickupToggle?: boolean;
  pickupActive: boolean;
  pickupAccessibilityLabel: string;
  onTogglePickup: () => void;
  /** スクロール中にカードへ重ねるとき、影で面を分ける */
  floating?: boolean;
};

export default function ResultListQuickActionsNative({
  jumpLabel,
  jumpAccessibilityLabel,
  jumpDisabled,
  onJump,
  showPickupToggle = true,
  pickupActive,
  pickupAccessibilityLabel,
  onTogglePickup,
  floating = false,
}: Props) {
  return (
    <View style={[styles.shell, floating ? styles.shellFloating : null]}>
      <View style={styles.panel}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={jumpAccessibilityLabel}
          accessibilityState={{ disabled: jumpDisabled }}
          disabled={jumpDisabled}
          onPress={onJump}
          style={({ pressed }) => [
            styles.cell,
            pressed && !jumpDisabled ? styles.cellPressed : null,
          ]}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={14}
            color={jumpDisabled ? "rgba(255,255,255,0.28)" : LABEL}
          />
          <Text
            style={[styles.jumpLabel, jumpDisabled ? styles.jumpLabelDisabled : null]}
            numberOfLines={1}
          >
            {jumpLabel}
          </Text>
        </Pressable>
        {showPickupToggle ? (
          <>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={pickupAccessibilityLabel}
              accessibilityState={{ selected: pickupActive }}
              onPress={onTogglePickup}
              style={({ pressed }) => [
                styles.cell,
                pressed ? styles.cellPressed : null,
              ]}
            >
              <Text
                style={[styles.pickupLabel, pickupActive ? styles.pickupLabelOn : null]}
                numberOfLines={1}
              >
                PICK UP
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {},
  shellFloating: {
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  panel: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 40,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  cell: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  cellPressed: {
    opacity: 0.55,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  jumpLabel: {
    flexShrink: 1,
    color: LABEL,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  jumpLabelDisabled: {
    color: "rgba(255,255,255,0.32)",
  },
  pickupLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  pickupLabelOn: {
    color: ACCENT,
  },
});
