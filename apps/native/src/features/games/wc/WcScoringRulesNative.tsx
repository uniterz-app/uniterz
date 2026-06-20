import { StyleSheet, Text, View } from "react-native";
import type { GamesLanguage } from "../gamesI18n";

type Props = {
  language: GamesLanguage;
  /** モーダル内では上罫線を付けない */
  variant?: "inline" | "modal";
};

type RuleSection = {
  title: string;
  intro: string;
  blocks: Array<{
    tone?: "default" | "highlight" | "warn";
    title?: string;
    lines: string[];
  }>;
};

const RULES: Record<GamesLanguage, RuleSection[]> = {
  ja: [
    {
      title: "総合得点",
      intro: "リザルトやランキングで使う、試合ごとのメインのポイントです。",
      blocks: [
        {
          tone: "warn",
          lines: ["勝者予想が外れた試合は基本点 0点（得点者ボーナスは別枠で加点あり）。"],
        },
        {
          lines: ["採点に使うスコアは規定時間＋延長の結果です。PK戦の本数は含みません。"],
        },
        {
          tone: "highlight",
          title: "勝者が合っているとき（基本点・最大10点）",
          lines: [
            "勝者 … +4点",
            "合計ゴール数 … +2点（0〜2 / 3〜4 / 5以上 の同じくくり）",
            "得失点差 … +2点（差が予想と結果で同じ）",
            "スコアの完全一致 … +2点",
          ],
        },
        {
          title: "ボーナス",
          lines: [
            "得点者ボーナス … +2点（オウンゴール除く）",
            "アップセットボーナス … +2点（市場45%以下の側を予想して的中）",
            "連勝ボーナス … 3〜4連勝 +1点 / 5〜6連勝 +2点 / 7連勝以上 +3点",
          ],
        },
      ],
    },
    {
      title: "スコア精度",
      intro: "予想スコアが実際の結果にどれだけ近かったか。総合得点とは別の指標です。",
      blocks: [
        {
          lines: ["1試合あたり 0〜10点。勝者を外してもつく指標です。"],
        },
        {
          tone: "highlight",
          title: "次の3つで加点（合計10点満点）",
          lines: [
            "勝ち負けの区分が同じ（ホーム勝 / 引き分け / アウェイ勝）… 最大4点",
            "合計ゴール数 … 最大4点（総合得点と同じくくり）",
            "スコアの近さ … 最大2点（ホーム・アウェイのズレ合計が小さいほど高得点）",
          ],
        },
      ],
    },
    {
      title: "アップセット得点",
      intro: "波乱した試合で、少数派予想が当たったときの加点です。",
      blocks: [
        {
          lines: ["総合得点に足される UPSET ボーナス（+2点）とは別の指標です。"],
        },
        {
          tone: "highlight",
          title: "条件と点数",
          lines: [
            "あなたの予想が市場45%以下の少数派で、かつ的中していれば加算。",
            "多数派の市場支持率が高いほど、アップセット得点は高くなります。",
            "多数派55%未満は0点、90%以上は10点。",
          ],
        },
      ],
    },
  ],
  en: [
    {
      title: "Total score",
      intro: "Main points per game on results and leaderboards.",
      blocks: [
        {
          tone: "warn",
          lines: ["Wrong winner means 0 base points. Goal scorer bonus is scored separately."],
        },
        {
          lines: ["Line score uses regulation + extra time. Penalty shootout goals are not counted."],
        },
        {
          tone: "highlight",
          title: "Correct winner (base, max 10)",
          lines: [
            "Winner … +4",
            "Total goals … +2 when both pick and result fall in 0-2 / 3-4 / 5+ buckets",
            "Goal difference … +2 when the difference matches",
            "Exact score … +2",
          ],
        },
        {
          title: "Bonuses",
          lines: [
            "Goal scorer bonus … +2 (own goals excluded)",
            "Upset bonus … +2 when your 45% or below market-side pick wins",
            "Win-streak bonus … 3-4 wins +1 / 5-6 wins +2 / 7+ wins +3",
          ],
        },
      ],
    },
    {
      title: "Score precision",
      intro: "How close your predicted score was, separate from total score.",
      blocks: [
        {
          lines: ["0-10 per game. Counts even if you miss the winner."],
        },
        {
          tone: "highlight",
          title: "Three checks (max 10 total)",
          lines: [
            "Same outcome (home / draw / away) … up to 4",
            "Total goals … up to 4 using the same buckets as total score",
            "Score closeness … up to 2; smaller home + away error scores higher",
          ],
        },
      ],
    },
    {
      title: "Upset points",
      intro: "When an upset happens and your minority pick wins.",
      blocks: [
        {
          lines: ["Separate from the +2 upset bonus on total score."],
        },
        {
          tone: "highlight",
          title: "Condition and points",
          lines: [
            "Your pick is a minority side at 45% or below on the market and it wins.",
            "Points scale with the majority side's market share.",
            "Majority below 55% gives 0; majority at 90%+ gives 10.",
          ],
        },
      ],
    },
  ],
};

function RuleBlock({
  block,
}: {
  block: RuleSection["blocks"][number];
}) {
  return (
    <View
      style={[
        styles.block,
        block.tone === "highlight" && styles.blockHighlight,
        block.tone === "warn" && styles.blockWarn,
      ]}
    >
      {block.title ? <Text style={styles.blockTitle}>{block.title}</Text> : null}
      {block.lines.map((line) => (
        <View key={line} style={styles.lineRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.line}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

/** Web `PredictionScoringFullRulesBody` の WC 向け Native 相当 */
export default function WcScoringRulesNative({
  language,
  variant = "inline",
}: Props) {
  const sections = RULES[language];
  const title = language === "en" ? "WC scoring rules" : "W杯 得点ルール";

  return (
    <View style={[styles.root, variant === "modal" && styles.rootModal]}>
      <Text style={styles.kicker}>{title}</Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.intro}>{section.intro}</Text>
          <View style={styles.blockList}>
            {section.blocks.map((block, idx) => (
              <RuleBlock key={`${section.title}-${idx}`} block={block} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 14,
  },
  rootModal: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  kicker: {
    color: "rgba(165,243,252,0.95)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  section: {
    gap: 7,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 15,
    fontWeight: "800",
  },
  intro: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 12,
    lineHeight: 17,
  },
  blockList: {
    gap: 7,
  },
  block: {
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  blockHighlight: {
    borderColor: "rgba(34,211,238,0.15)",
    backgroundColor: "rgba(34,211,238,0.055)",
  },
  blockWarn: {
    borderColor: "rgba(244,63,94,0.18)",
    backgroundColor: "rgba(244,63,94,0.055)",
  },
  blockTitle: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12.5,
    fontWeight: "800",
  },
  lineRow: {
    flexDirection: "row",
    gap: 6,
  },
  bullet: {
    width: 10,
    color: "rgba(250,204,21,0.9)",
    fontSize: 12,
    lineHeight: 18,
  },
  line: {
    flex: 1,
    color: "rgba(255,255,255,0.74)",
    fontSize: 12,
    lineHeight: 18,
  },
});
