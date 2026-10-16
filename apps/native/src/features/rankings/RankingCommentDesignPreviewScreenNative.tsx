/**
 * __DEV__ — PRO LEAGUE ひとことの見せ方案を並べるプレビュー。
 * 本番は `RankingRowCommentNative` の既定 variant を使う。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import DailyScoreRankRowNative, {
  dailyScoreRankRowSubStyles,
} from "./DailyScoreRankRowNative";
import { CyberRankingListRowNative } from "./CyberRankingListRowNative";
import RankingRowCommentNative, {
  type RankingRowCommentVariantNative,
} from "./RankingRowCommentNative";
import type { RankingsLanguage } from "./rankingsTexts";
import { rankingRowProSkinVariant } from "../../../../../lib/rankings/rankingRowProSkinVariant";

const VARIANT_LABELS: { variant: RankingRowCommentVariantNative; label: string }[] = [
  { variant: "bubble", label: "A 吹き出し（シアン枠）" },
  { variant: "bubbleFill", label: "B 吹き出し（塗り・チャット風）" },
  { variant: "avatarBubble", label: "C 吹き出し（アバターから）" },
  { variant: "quote", label: "D 引用符" },
  { variant: "icon", label: "E アイコン + テキスト" },
  { variant: "tag", label: "F カードにぶら下がるタグ" },
  { variant: "cyber", label: "G サイバー斜め枠" },
];

const SHORT_COMMENT = "ワザとです";
const LONG_COMMENT = "今日は全部ホーム勝ちに張った。明日も続ける";

const PRO_SKIN = rankingRowProSkinVariant("pro", null);

function DailySample({
  rank,
  name,
  comment,
  variant,
  countryCode,
}: {
  rank: number;
  name: string;
  comment: string;
  variant: RankingRowCommentVariantNative;
  countryCode: string;
}) {
  return (
    <View>
      <DailyScoreRankRowNative
        rank={rank}
        name={name}
        isPro
        planProBgVariant={PRO_SKIN}
        countryCode={countryCode}
        sub={
          <>
            <Text style={dailyScoreRankRowSubStyles.muted}>2 予想</Text>
            <Text style={dailyScoreRankRowSubStyles.hits}>2/2 的中</Text>
          </>
        }
        value={String(48 - rank * 6)}
        valueUnit="PTS"
      />
      <RankingRowCommentNative comment={comment} align="daily" variant={variant} />
    </View>
  );
}

export default function RankingCommentDesignPreviewScreenNative({
  language,
  onClose,
}: {
  language: RankingsLanguage;
  onClose: () => void;
}) {
  return (
    <MobilePageShell
      title="ひとこと デザイン案"
      eyebrow="DEV"
      subtitle="PRO LEAGUE の TODAY / ランキング一覧で、Pro の行の下に出すひとことの見せ方"
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {VARIANT_LABELS.map(({ variant, label }) => (
          <View key={variant} style={styles.section}>
            <Text style={styles.sectionTitle}>{label}</Text>

            <Text style={styles.caption}>TODAY</Text>
            <View style={styles.list}>
              <DailySample
                rank={3}
                name="CHIKI"
                comment={SHORT_COMMENT}
                variant={variant}
                countryCode="JP"
              />
              <DailySample
                rank={4}
                name="Kaito"
                comment={LONG_COMMENT}
                variant={variant}
                countryCode="US"
              />
            </View>

            <Text style={styles.caption}>ランキング一覧</Text>
            <View>
              <CyberRankingListRowNative
                rank={5}
                displayName="CHIKI"
                metric="totalScore"
                counted={412.6}
                posts={38}
                countryCode="JP"
                avgRow={{ avgTotalScore: 10.9 }}
                language={language}
                isPro
                rankDeltaPlaces={2}
                proSkinVariant={PRO_SKIN}
              />
              <RankingRowCommentNative
                comment={SHORT_COMMENT}
                align="list"
                variant={variant}
              />
              <CyberRankingListRowNative
                rank={6}
                displayName="Kaito"
                metric="totalScore"
                counted={398.2}
                posts={40}
                countryCode="US"
                avgRow={{ avgTotalScore: 9.9 }}
                language={language}
                isPro={false}
                rankDeltaPlaces={-1}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 64,
    gap: 28,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00F5FF",
    paddingHorizontal: 4,
  },
  caption: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  list: { gap: 6 },
});
