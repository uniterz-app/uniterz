import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

type Rgb = { r: number; g: number; b: number };

function parseHexColor(color: string): Rgb {
  const input = color.trim().replace(/^#/, "");
  if (/^[\da-fA-F]{6}$/.test(input)) {
    return {
      r: parseInt(input.slice(0, 2), 16),
      g: parseInt(input.slice(2, 4), 16),
      b: parseInt(input.slice(4, 6), 16),
    };
  }
  if (/^[\da-fA-F]{3}$/.test(input)) {
    return {
      r: parseInt(input[0] + input[0], 16),
      g: parseInt(input[1] + input[1], 16),
      b: parseInt(input[2] + input[2], 16),
    };
  }
  return { r: 90, g: 164, b: 255 };
}

function rgba({ r, g, b }: Rgb, alpha: number): string {
  return `rgba(${r},${g},${b},${alpha})`;
}

type Dot = { left: `${number}%`; top: `${number}%`; size: number; opacity: number };

function buildHalftoneDots(): Dot[] {
  const dots: Dot[] = [];
  for (let row = 0; row < 13; row += 1) {
    const top = 13 + row * 6.2;
    const offset = row % 2 === 0 ? 0 : 3.4;
    for (let col = 0; col < 8; col += 1) {
      const left = 20 + col * 8 + offset;
      if (left > 82) continue;
      const depth = row / 12;
      const size = 1.15 + depth * 0.95;
      const opacity = Math.min(0.82, 0.32 + depth * 0.34);
      dots.push({
        left: `${left}%`,
        top: `${top}%`,
        size,
        opacity,
      });
    }
  }
  return dots;
}

const DOTS = buildHalftoneDots();

type JerseyMarkProps = {
  accent: string;
  accentEnd?: string;
  size?: number;
};

export default function JerseyMark({
  accent,
  accentEnd,
  size = 56,
}: JerseyMarkProps) {
  const base = useMemo(() => parseHexColor(accent), [accent]);
  const tail = useMemo(
    () => parseHexColor(accentEnd ?? accent),
    [accent, accentEnd]
  );
  const glowColor = useMemo(() => rgba(base, 0.6), [base]);
  const accentStroke = useMemo(() => rgba(base, 0.95), [base]);
  const fillColor = useMemo(() => rgba(tail, 0.22), [tail]);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          shadowColor: glowColor,
        },
      ]}
    >
      <View
        style={[
          styles.outlineAccent,
          {
            backgroundColor: accentStroke,
          },
        ]}
      >
        <View
          style={[
            styles.outlineWhite,
            {
              backgroundColor: "rgba(240,247,255,0.94)",
            },
          ]}
        >
          <View
            style={[
              styles.jerseyFill,
              {
                backgroundColor: fillColor,
              },
            ]}
          >
            <View style={styles.jerseyTopGlow} />
            <View style={[styles.jerseyStripe, { backgroundColor: rgba(base, 0.4) }]} />
            <View style={styles.jerseyCenterStripe} />
            <View style={styles.jerseyDotLayer}>
              {DOTS.map((dot, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.dot,
                    {
                      left: dot.left,
                      top: dot.top,
                      width: dot.size,
                      height: dot.size,
                      opacity: dot.opacity,
                      backgroundColor: rgba(base, 0.95),
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.neckCutFill} />
            <View style={styles.armCutLeftFill} />
            <View style={styles.armCutRightFill} />
            <View style={styles.hemCutLeftFill} />
            <View style={styles.hemCutRightFill} />
          </View>
          <View style={styles.neckCutWhite} />
          <View style={styles.armCutLeftWhite} />
          <View style={styles.armCutRightWhite} />
          <View style={styles.hemCutLeftWhite} />
          <View style={styles.hemCutRightWhite} />
        </View>
        <View style={styles.neckCutAccent} />
        <View style={styles.armCutLeftAccent} />
        <View style={styles.armCutRightAccent} />
        <View style={styles.hemCutLeftAccent} />
        <View style={styles.hemCutRightAccent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 11,
    elevation: 3,
  },
  outlineAccent: {
    width: 42,
    height: 50,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineWhite: {
    width: 40,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyFill: {
    width: 38,
    height: 46,
    borderRadius: 7,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  jerseyDotLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: "absolute",
    borderRadius: 999,
  },
  jerseyStripe: {
    width: "100%",
    height: 7,
    position: "absolute",
    top: 17,
  },
  jerseyCenterStripe: {
    position: "absolute",
    left: "47%",
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(226,232,240,0.35)",
  },
  neckCutFill: {
    position: "absolute",
    top: -1,
    width: 15,
    height: 8,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: "#07101f",
  },
  armCutLeftFill: {
    position: "absolute",
    left: -7,
    top: 9,
    width: 13,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#07101f",
  },
  armCutRightFill: {
    position: "absolute",
    right: -7,
    top: 9,
    width: 13,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#07101f",
  },
  hemCutLeftFill: {
    position: "absolute",
    left: -1,
    bottom: -1,
    width: 7,
    height: 7,
    borderTopRightRadius: 7,
    backgroundColor: "#07101f",
  },
  hemCutRightFill: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 7,
    height: 7,
    borderTopLeftRadius: 7,
    backgroundColor: "#07101f",
  },
  neckCutWhite: {
    position: "absolute",
    top: -1,
    width: 17,
    height: 9,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: "#07101f",
  },
  armCutLeftWhite: {
    position: "absolute",
    left: -8,
    top: 8,
    width: 14,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#07101f",
  },
  armCutRightWhite: {
    position: "absolute",
    right: -8,
    top: 8,
    width: 14,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#07101f",
  },
  hemCutLeftWhite: {
    position: "absolute",
    left: -1,
    bottom: -1,
    width: 8,
    height: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#07101f",
  },
  hemCutRightWhite: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 8,
    height: 8,
    borderTopLeftRadius: 8,
    backgroundColor: "#07101f",
  },
  neckCutAccent: {
    position: "absolute",
    top: -1,
    width: 19,
    height: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#07101f",
  },
  armCutLeftAccent: {
    position: "absolute",
    left: -9,
    top: 7,
    width: 15,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#07101f",
  },
  armCutRightAccent: {
    position: "absolute",
    right: -9,
    top: 7,
    width: 15,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#07101f",
  },
  hemCutLeftAccent: {
    position: "absolute",
    left: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderTopRightRadius: 9,
    backgroundColor: "#07101f",
  },
  hemCutRightAccent: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderTopLeftRadius: 9,
    backgroundColor: "#07101f",
  },
});
