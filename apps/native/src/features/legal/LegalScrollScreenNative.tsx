import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { colors, spacing } from "../../theme/tokens";

type Section = { title: string; body: string };

type Props = {
  title: string;
  description?: string;
  updatedAt?: string;
  sections: Section[];
  children?: ReactNode;
};

export default function LegalScrollScreenNative({
  title,
  description,
  updatedAt,
  sections,
  children,
}: Props) {
  const navigation = useNavigation();

  return (
    <MobilePageShell title={title} onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {description || updatedAt ? (
          <View style={styles.introCard}>
            {description ? <Text style={styles.desc}>{description}</Text> : null}
            {updatedAt ? <Text style={styles.updated}>最終更新: {updatedAt}</Text> : null}
          </View>
        ) : null}
        {sections.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        {children}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 56,
    gap: spacing.md,
  },
  introCard: {
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  desc: { color: "rgba(226,232,240,0.84)", fontSize: 14, lineHeight: 22 },
  updated: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.24)",
    backgroundColor: "rgba(8,47,73,0.28)",
    color: "rgba(165,243,252,0.82)",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  section: {
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
  },
  sectionBody: { color: "rgba(203,213,225,0.88)", fontSize: 14, lineHeight: 22 },
});
