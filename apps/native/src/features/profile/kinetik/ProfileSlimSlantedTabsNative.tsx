/** Web `ProfileEditKinetikPanel` の TOTAL/WEEK/MONTH・PICK UP/ALL GAMES 相当（CyberSlantedTab より低い専用版） */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

const CYAN = "#00F5FF";
const ACTIVE_TEXT = "#050508";
const FONT_SIZE = 9;

function ScanLines({ height }: { height: number }) {
  const lines = [];
  for (let y = 2; y < height; y += 3) {
    lines.push(<View key={y} style={[styles.scanLine, { top: y }]} />);
  }
  return (
    <View pointerEvents="none" style={styles.scanHost}>
      {lines}
    </View>
  );
}

export function ProfileSlimSlantedTabsNative<T extends string>({
  options,
  value,
  onChange,
  height,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  height: number;
}) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => [
              styles.slot,
              { height },
              pressed ? styles.pressed : null,
            ]}
          >
            <View
              pointerEvents="none"
              style={[styles.chrome, active ? styles.chromeActive : styles.chromeInactive]}
            >
              {active ? <ScanLines height={height} /> : null}
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
