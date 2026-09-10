import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme/tokens";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

type Props = { language: import("./rankingsTexts").RankingsLanguage };

/** BracketLeaderboardSection 相当 */
export default function BracketLeaderboardSectionNative({ language }: Props) {
  const lang = resolveLocalizedLang(language);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>
        {L(lang, {
          ja: "Bracket リーダーボード",
          en: "Bracket Leaderboard",
          ko: "Bracket 리더보드",
          zh: "对阵图排行榜",
          es: "Clasificación Bracket",
          pt: "Leaderboard Bracket",
          fr: "Classement Bracket",
        })}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {[1, 2, 3, 4, 5].map((rank) => (
          <View key={rank} style={styles.card}>
            <Text style={styles.rank}>#{rank}</Text>
            <Text style={styles.handle}>@player{rank}</Text>
            <Text style={styles.score}>1280 pts</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.note}>
        {L(lang, {
          ja: "ブラケット予想の精度で競うリーダーボード",
          en: "Compete on bracket prediction accuracy",
          ko: "브래킷 예측 정확도로 겨루는 리더보드",
          zh: "以对阵图预测准确度竞技的排行榜",
          es: "Compite por precisión de predicciones de bracket",
          pt: "Dispute pela precisão das previsões de chave",
          fr: "Compétition sur la précision des brackets",
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12, paddingVertical: 8 },
  title: {
    fontFamily: fonts.metric,
    color: colors.textPrimary,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  row: { gap: 10, paddingVertical: 4 },
  card: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.glassCardBg,
  },
  rank: { color: colors.accentCyan, fontWeight: "800", fontSize: 16 },
  handle: { color: colors.textPrimary, marginTop: 4, fontSize: 13 },
  score: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  note: { color: colors.textMuted, fontSize: 12 },
});
