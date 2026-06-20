import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type HelpFaqItemNative = {
  id: string;
  label: string;
  question: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  gradient: readonly [string, string, string];
  answer: ReactNode;
};

type Props = {
  item: HelpFaqItemNative;
  isOpen: boolean;
  onToggle: () => void;
};

/** Web `HelpPage` の `AccordionItem` 相当 */
export default function HelpAccordionItemNative({ item, isOpen, onToggle }: Props) {
  return (
    <View style={styles.root}>
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={[...item.gradient]} style={styles.iconBox}>
            <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor} />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.question}>{item.question}</Text>
          </View>
        </View>
        <Text style={styles.hint}>?</Text>
      </Pressable>
      {isOpen ? <View style={styles.answer}>{item.answer}</View> : null}
    </View>
  );
}

export function HelpAnswerText({ children }: { children: ReactNode }) {
  return <Text style={styles.answerText}>{children}</Text>;
}

export function HelpBulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listItem}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0b1020",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.5)",
  },
  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    lineHeight: 20,
  },
  hint: {
    fontSize: 14,
    fontWeight: "700",
    color: "#67e8f9",
  },
  answer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
  list: {
    gap: 4,
    paddingLeft: 4,
  },
  listRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bullet: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 22,
  },
  listItem: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.8)",
  },
});
