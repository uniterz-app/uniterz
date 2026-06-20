import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Section = {
  id: string;
  title: string;
  content: string;
};

type Props = {
  sections: Section[];
  defaultOpenId?: string;
  intro?: string;
};

/** Web `ScoringLogicSections` 相当 */
export default function HelpScoringLogicNative({ sections, defaultOpenId, intro }: Props) {
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
                <Text style={styles.sectionText}>{section.content}</Text>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
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
    fontSize: 12,
    color: "rgba(103,232,249,0.8)",
    marginLeft: 8,
  },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
});
