import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { CyberSegAccent } from "../../../../../app/component/rankings/CyberSlantedSegBar";

function filledSegCount(pct: number, segments: number): number {
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * segments);
}

/** Web `CyberSlantedSegBar` のネイティブ版 */
export function CyberSlantedSegBarNative({
  pct,
  segments = 12,
  compact = false,
  accent,
  enter = true,
}: {
  pct: number;
  segments?: number;
  compact?: boolean;
  accent: CyberSegAccent;
  enter?: boolean;
}) {
  const [shown, setShown] = useState(enter);
  const filled = shown ? filledSegCount(pct, segments) : 0;
  const segH = compact ? 9 : 11;

  useEffect(() => {
    if (enter) {
      setShown(true);
      return;
    }
    setShown(false);
    const id = setTimeout(() => setShown(true), 80);
    return () => clearTimeout(id);
  }, [pct, segments, enter]);

  return (
    <View style={styles.track}>
      {Array.from({ length: segments }).map((_, i) => {
        const lit = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.seg,
              {
                height: segH,
                backgroundColor: lit ? accent.border : "rgba(255,255,255,0.03)",
                borderColor: lit ? (accent.bg ?? accent.border) : "rgba(0,245,255,0.22)",
                shadowColor: lit ? accent.glow : "transparent",
                shadowOpacity: lit ? 0.85 : 0,
                shadowRadius: lit ? 8 : 0,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
    transform: [{ skewX: "-16deg" }],
  },
  seg: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    overflow: "hidden",
  },
});
