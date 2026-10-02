/**
 * Web `RadarChart` の簡易ネイティブ版（4軸・0–10 スケール）。
 */
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polygon } from "react-native-svg";
import { colors } from "../../theme/tokens";
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

type RadarAxisKey = "winRate" | "upset" | "volume" | "streak";

function score10ToLevel(score: number): "S" | "M" | "W" {
  if (score >= 8) return "S";
  if (score >= 4) return "M";
  return "W";
}

function axisLabel(key: RadarAxisKey, lang: LocalizedLang): string {
  switch (key) {
    case "winRate":
      return L(lang, {
        ja: "勝率",
        en: "Win rate",
        ko: "승률",
        zh: "胜率",
        es: "Win rate",
        pt: "Win rate",
        fr: "Win rate",
      });
    case "volume":
      return L(lang, {
        ja: "投稿量",
        en: "Volume",
        ko: "게시량",
        zh: "预测量",
        es: "Volumen",
        pt: "Volume",
        fr: "Volume",
      });
    case "upset":
      return "Upset";
    case "streak":
      return L(lang, {
        ja: "耐性",
        en: "Stamina",
        ko: "지구력",
        zh: "耐力",
        es: "Resistencia",
        pt: "Resistência",
        fr: "Endurance",
      });
  }
}

const AXIS_KEYS: RadarAxisKey[] = ["winRate", "volume", "upset", "streak"];

type Props = {
  values: Partial<Record<RadarAxisKey, number>>;
  language: string;
  size?: number;
};

function clamp10(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

function levelColor(lv: "S" | "M" | "W"): string {
  if (lv === "S") return "#6ee7b7";
  if (lv === "M") return "#fcd34d";
  return "#94a3b8";
}

export default function ProfileRadarChartNative({ values, language, size = 220 }: Props) {
  const lang = resolveLocalizedLang(language);
  const center = size / 2;
  const radius = size * 0.34;

  const points = useMemo(() => {
    return AXIS_KEYS.map((key, i) => {
      const angle = (Math.PI * 2 * i) / AXIS_KEYS.length - Math.PI / 2;
      const v = clamp10(values[key]);
      const r = (v / 10) * radius;
      return {
        key,
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 22) * Math.cos(angle),
        labelY: center + (radius + 22) * Math.sin(angle),
        value: v,
        label: axisLabel(key, lang),
      };
    });
  }, [values, center, radius, lang]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <Circle
            key={t}
            cx={center}
            cy={center}
            r={radius * t}
            stroke="rgba(34,211,238,0.25)"
            strokeWidth={1}
            fill="none"
          />
        ))}
        {points.map((p, i) => (
          <Line
            key={`spoke-${i}`}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos((Math.PI * 2 * i) / AXIS_KEYS.length - Math.PI / 2)}
            y2={center + radius * Math.sin((Math.PI * 2 * i) / AXIS_KEYS.length - Math.PI / 2)}
            stroke="rgba(34,211,238,0.2)"
            strokeWidth={1}
          />
        ))}
        <Polygon
          points={polygon}
          fill="rgba(34,211,238,0.22)"
          stroke="#22d3ee"
          strokeWidth={2}
        />
      </Svg>
      <View style={[styles.labels, { width: size, height: size }]}>
        {points.map((p) => {
          const lv = score10ToLevel(p.value);
          return (
            <View
              key={p.key}
              style={[
                styles.labelChip,
                {
                  left: p.labelX - 36,
                  top: p.labelY - 14,
                },
              ]}
            >
              <Text style={styles.labelText} numberOfLines={1}>
                {p.label}
              </Text>
              <Text style={[styles.valueText, { color: levelColor(lv) }]}>
                {p.value.toFixed(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "center", marginVertical: 8 },
  labels: { position: "absolute", left: 0, top: 0 },
  labelChip: {
    position: "absolute",
    width: 72,
    alignItems: "center",
  },
  labelText: { color: colors.textSecondary, fontSize: 9, textAlign: "center" },
  valueText: { fontSize: 11, fontWeight: "800", textAlign: "center" },
});
