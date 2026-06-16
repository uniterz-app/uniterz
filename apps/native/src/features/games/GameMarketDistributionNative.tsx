import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { usePredictionPostDistribution } from "./usePredictionPostDistribution";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { colors, radius } from "../../theme/tokens";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";

type Props = {
  gameId: string;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
  isSoccer: boolean;
  language: GamesLanguage;
  t: GamesTexts;
};

/** Web `GamePredictionDistribution` 相当（勝敗分布ドーナツ + 凡例） */
export default function GameMarketDistributionNative({
  gameId,
  homeName,
  awayName,
  homeColor,
  awayColor,
  isSoccer,
  language,
  t,
}: Props) {
  const { data, loading, error } = usePredictionPostDistribution(gameId, true);
  const total = isSoccer ? data.home + data.away + data.draw : data.home + data.away;

  if (loading) {
    return (
      <View style={styles.loading}>
        <BlocksPulseLoader pixelScale={0.85} />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (total <= 0) {
    return <Text style={styles.muted}>{t.predictToolMarketNoPosts}</Text>;
  }

  const pct = (n: number) => `${((100 * n) / total).toFixed(1)}%`;
  const size = 160;
  const stroke = 48;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const homeLen = c * (data.home / total);
  const drawLen = isSoccer ? c * (data.draw / total) : 0;
  const awayLen = c * (data.away / total);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {language === "ja" ? "コミュニティ予想" : "Community picks"}
      </Text>
      <View style={styles.row}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={homeColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${homeLen} ${c - homeLen}`}
            strokeDashoffset={c * 0.25}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
          {isSoccer ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="#9ca3af"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${drawLen} ${c - drawLen}`}
              strokeDashoffset={c * 0.25 - homeLen}
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          ) : null}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={awayColor}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${awayLen} ${c - awayLen}`}
            strokeDashoffset={c * 0.25 - homeLen - drawLen}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.legend}>
          <LegendRow color={homeColor} label={homeName} value={pct(data.home)} />
          {isSoccer ? (
            <LegendRow color="#9ca3af" label={t.predictToolDrawLabel} value={pct(data.draw)} />
          ) : null}
          <LegendRow color={awayColor} label={awayName} value={pct(data.away)} />
          <Text style={styles.total}>
            {language === "ja" ? `合計 ${total} 件` : `${total} posts`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 24, alignItems: "center" },
  card: {
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
    gap: 12,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 999 },
  legendLabel: { flex: 1, color: colors.textSecondary, fontSize: 12 },
  legendValue: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  total: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  muted: { color: colors.textSecondary, fontSize: 13, textAlign: "center", paddingVertical: 16 },
  error: { color: "#fca5a5", fontSize: 13 },
});
