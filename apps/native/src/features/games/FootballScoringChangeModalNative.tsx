import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { resolveFootballScoringChangeCopy } from "../../../../../lib/predict/resolveFootballScoringChangeCopy";
import type { GamesLanguage } from "./gamesI18n";

type Props = {
  visible: boolean;
  language: GamesLanguage;
  ctaLabel: string;
  onClose: () => void;
};

type RuleBlock = {
  tone?: "default" | "highlight" | "warn";
  title?: string;
  lines: string[];
};

const RULE_BLOCKS: Record<GamesLanguage, RuleBlock[]> = {
  ja: [
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
        "HOME得点 … +2点（ホーム得点が完全一致）",
        "AWAY得点 … +2点（アウェイ得点が完全一致）",
        "得失点差 … +2点（得点差が完全一致）",
        "例）予想 2–0・結果 2–1 → HOME +2 → 基本点 6点",
        "例）予想 2–0・結果 2–0 → 4+2+2+2 = 10点",
      ],
    },
    {
      title: "ボーナス（基本点に上乗せ）",
      lines: [
        "得点者ボーナス … +2点（W杯・オウンゴール除く）",
        "アップセットボーナス … +2点",
        "連勝ボーナス … 3〜4連勝 +1点 / 5〜6連勝 +2点 / 7連勝以上 +3点",
      ],
    },
    {
      lines: ["総合得点 ＝ 基本点 ＋ ボーナス"],
    },
  ],
  en: [
    {
      tone: "warn",
      lines: ["Wrong winner → 0 base points (goal scorer bonus is separate)."],
    },
    {
      lines: ["Line score = regulation + extra time (penalty shootout goals not counted)."],
    },
    {
      tone: "highlight",
      title: "When the winner is correct (base, max 10)",
      lines: [
        "Winner … +4",
        "HOME goals … +2 (exact match)",
        "AWAY goals … +2 (exact match)",
        "Goal difference … +2 (exact match)",
        "e.g. pick 2–0, result 2–1 → HOME +2 → base 6",
        "e.g. pick 2–0, result 2–0 → 4+2+2+2 = 10",
      ],
    },
    {
      title: "Bonuses (added on top)",
      lines: [
        "Goal scorer bonus … +2 (WC, own goals excluded)",
        "Upset bonus … +2",
        "Win-streak bonus … 3-4 wins +1 / 5-6 wins +2 / 7+ wins +3",
      ],
    },
    {
      lines: ["Total score = base + bonuses"],
    },
  ],
};

function RuleBlockView({ block }: { block: RuleBlock }) {
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

export default function FootballScoringChangeModalNative({
  visible,
  language,
  ctaLabel,
  onClose,
}: Props) {
  const copy = resolveFootballScoringChangeCopy(language);
  const blocks = RULE_BLOCKS[language];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        />
        <View style={styles.card}>
          <Text style={styles.tag}>{copy.tag}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.lead}>{copy.lead}</Text>
          <View style={styles.divider} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.blockList}>
              {blocks.map((block, idx) => (
                <RuleBlockView key={`${block.title ?? "block"}-${idx}`} block={block} />
              ))}
            </View>
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  card: {
    maxHeight: "88%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#0c1419",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  tag: {
    textAlign: "center",
    color: "rgba(34,211,238,0.9)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  lead: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(34,211,238,0.25)",
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 4,
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
  ctaBtn: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnPressed: {
    opacity: 0.88,
  },
  ctaText: {
    color: "rgba(236,254,255,0.95)",
    fontSize: 14,
    fontWeight: "700",
  },
});
