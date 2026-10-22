/** Web `ProfileEditKinetikPanel` の PICK UP / ALL GAMES 切替相当（CyberSlantedTab より低い専用版） */
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ProfileKinetikGames } from "../../../../../../lib/profile/useNbaKinetikMonthlyStats";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const CYAN = "#00F5FF";
const ACTIVE_TEXT = "#050508";
const TAB_H = 20;
const FONT_SIZE = 9;

const OPTIONS: { value: ProfileKinetikGames; label: string }[] = [
  { value: "pickup", label: "PICK UP" },
  { value: "all", label: "ALL GAMES" },
];

function ScanLines() {
  const lines = [];
  for (let y = 2; y < TAB_H; y += 3) {
    lines.push(<View key={y} style={[styles.scanLine, { top: y }]} />);
  }
  return (
    <View pointerEvents="none" style={styles.scanHost}>
      {lines}
    </View>
  );
}

export function ProfileMetricsGamesToggleNative({
  value,
  onChange,
}: {
  value: ProfileKinetikGames;
  onChange: (next: ProfileKinetikGames) => void;
}) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => [styles.slot, pressed ? styles.pressed : null]}
          >
            <View
              pointerEvents="none"
              style={[styles.chrome, active ? styles.chromeActive : styles.chromeInactive]}
            >
              {active ? <ScanLines /> : null}
            </View>
            <View pointerEvents="none" style={styles.labelLayer}>
              <View style={styles.labelSkew}>
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.1}
                  style={[styles.label, { color: active ? ACTIVE_TEXT : CYAN }]}
                >
                  {opt.label}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    paddingVertical: 4,
  },
  slot: {
    flex: 1,
    minWidth: 0,
    height: TAB_H,
  },
  pressed: {
    opacity: 0.94,
  },
  chrome: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ skewX: "-14deg" }],
    overflow: "hidden",
  },
  chromeActive: {
    backgroundColor: CYAN,
  },
  chromeInactive: {
    borderWidth: 1,
    borderColor: CYAN,
    backgroundColor: "transparent",
  },
  scanHost: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  labelLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  labelSkew: {
    transform: [{ skewX: "-6deg" }],
  },
  label: {
    fontFamily: METRIC_FONT,
    fontSize: FONT_SIZE,
    fontWeight: "700",
    lineHeight: Math.round(FONT_SIZE * 1.2),
    letterSpacing: FONT_SIZE * 0.14,
    textAlign: "center",
  },
});
