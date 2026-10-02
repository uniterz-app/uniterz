import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  HelpScoringSectionCopy,
  HelpTextBlock,
} from "../../../../../lib/settings/helpFaqsCopy";

type Props = {
  sections: readonly HelpScoringSectionCopy[];
  defaultOpenId?: string;
  intro?: string;
};

function ScoringBlocks({ blocks }: { blocks: readonly HelpTextBlock[] }) {
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => (
        <Text
          key={`${block.kind}-${index}`}
          style={block.kind === "heading" ? styles.heading : styles.sectionText}
        >
          {block.text}
        </Text>
      ))}
    </View>
  );
}

/** Web `ScoringLogicSections` 相当 — 四角・白黒 */
export default function HelpScoringLogicNative({
  sections,
  defaultOpenId,
  intro,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <View style={styles.root}>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      {sections.map((section) => {
        const open = openId === section.id;
        return (
          <View key={section.id} style={styles.section}>
            <Pressable
              style={styles.sectionHeader}
              onPress={() => setOpenId(open ? null : section.id)}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.toggle}>{open ? "−" : "+"}</Text>
            </Pressable>
            {open ? (
              <View style={styles.sectionBody}>
                <ScoringBlocks blocks={section.blocks} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  section: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  toggle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginLeft: 8,
  },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  blocks: { gap: 8 },
  heading: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
});
