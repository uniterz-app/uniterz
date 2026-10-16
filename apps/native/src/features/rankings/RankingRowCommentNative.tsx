/** Web `RankingRowComment` 相当 — PRO LEAGUE ランキング行カードのすぐ下に出すひとこと（カードの外） */
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

/** 行の国旗の左端（DailyScoreRankRowNative / CyberRankingListRowNative の左列幅） */
const FLAG_PADDING = {
  daily: 101,
  list: 132,
} as const;

/** 行のアバターの左端と、アバター中心に吹き出しのしっぽを置くオフセット */
const AVATAR_PADDING = {
  daily: 53,
  list: 76,
} as const;
const AVATAR_TAIL_LEFT = {
  daily: 14,
  list: 18,
} as const;

export type RankingRowCommentAlignNative = keyof typeof FLAG_PADDING;

export const RANKING_ROW_COMMENT_VARIANTS_NATIVE = [
  "bubble",
  "bubbleFill",
  "avatarBubble",
  "quote",
  "icon",
  "tag",
  "cyber",
] as const;

export type RankingRowCommentVariantNative =
  (typeof RANKING_ROW_COMMENT_VARIANTS_NATIVE)[number];

const CYAN = "#00F5FF";
const BUBBLE_BG = "#0B1216";
const BUBBLE_BORDER = "rgba(0,245,255,0.3)";
const FILL_BG = "#0E2A30";

export default function RankingRowCommentNative({
  comment,
  align,
  variant = "bubble",
}: {
  comment?: string | null;
  align: RankingRowCommentAlignNative;
  variant?: RankingRowCommentVariantNative;
}) {
  const text = comment?.trim();
  if (!text) return null;

  if (variant === "bubble" || variant === "bubbleFill" || variant === "avatarBubble") {
    const fill = variant === "bubbleFill";
    const fromAvatar = variant === "avatarBubble";
    return (
      <View
        style={[
          styles.wrap,
          {
            paddingLeft: fromAvatar ? AVATAR_PADDING[align] : FLAG_PADDING[align],
          },
        ]}
      >
        <View style={[styles.bubble, fill && styles.bubbleFill]}>
          <View
            style={[
              styles.tail,
              fill && styles.tailFill,
              fromAvatar && { left: AVATAR_TAIL_LEFT[align] },
            ]}
          />
          <Text style={[styles.text, fill && styles.textFill]} numberOfLines={1}>
            {text}
          </Text>
        </View>
      </View>
    );
  }

  if (variant === "quote") {
    return (
      <View style={[styles.wrapRow, { paddingLeft: FLAG_PADDING[align] }]}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={[styles.text, styles.quoteText]} numberOfLines={1}>
          {text}
        </Text>
        <Text style={[styles.quoteMark, styles.quoteMarkEnd]}>”</Text>
      </View>
    );
  }

  if (variant === "icon") {
    return (
      <View style={[styles.wrapRow, { paddingLeft: FLAG_PADDING[align] }]}>
        <MaterialCommunityIcons
          name="message-processing-outline"
          size={13}
          color={CYAN}
          style={styles.icon}
        />
        <Text style={[styles.text, styles.shrink]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    );
  }

  if (variant === "tag") {
    return (
      <View style={[styles.tagWrap, { paddingLeft: FLAG_PADDING[align] }]}>
        <View style={styles.tag}>
          <Text style={[styles.text, styles.shrink]} numberOfLines={1}>
            {text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingLeft: FLAG_PADDING[align] }]}>
      <View style={styles.cyber}>
        <View style={styles.cyberInner}>
          <Text style={styles.cyberPrefix}>//</Text>
          <Text style={[styles.text, styles.shrink]} numberOfLines={1}>
            {text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    marginBottom: 8,
    paddingRight: 12,
    alignItems: "flex-start",
  },
  wrapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
    paddingRight: 12,
  },
  shrink: { flexShrink: 1 },
  text: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.85)",
  },

  bubble: {
    maxWidth: "100%",
    flexShrink: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BUBBLE_BORDER,
    backgroundColor: BUBBLE_BG,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bubbleFill: {
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: FILL_BG,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tail: {
    position: "absolute",
    top: -4.5,
    left: 10,
    width: 8,
    height: 8,
    transform: [{ rotate: "45deg" }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: BUBBLE_BORDER,
    backgroundColor: BUBBLE_BG,
  },
  tailFill: {
    top: -4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    backgroundColor: FILL_BG,
  },
  textFill: { color: "#FFFFFF" },

  quoteMark: {
    fontSize: 20,
    lineHeight: 20,
    color: CYAN,
    fontWeight: "700",
    marginRight: 3,
    marginTop: 4,
  },
  quoteMarkEnd: { marginRight: 0, marginLeft: 3 },
  quoteText: {
    flexShrink: 1,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
  },

  icon: { marginRight: 5 },

  tagWrap: {
    marginTop: -1,
    marginBottom: 8,
    paddingRight: 12,
    alignItems: "flex-start",
  },
  tag: {
    maxWidth: "100%",
    flexShrink: 1,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 4,
  },

  cyber: {
    maxWidth: "100%",
    flexShrink: 1,
    borderWidth: 1,
    borderColor: BUBBLE_BORDER,
    backgroundColor: BUBBLE_BG,
    transform: [{ skewX: "-12deg" }],
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cyberInner: {
    flexDirection: "row",
    alignItems: "center",
    transform: [{ skewX: "12deg" }],
  },
  cyberPrefix: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    color: CYAN,
    marginRight: 6,
  },
});
