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
      <ScrollView contentContainerStyle={styles.content}>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
        {updatedAt ? <Text style={styles.updated}>最終更新: {updatedAt}</Text> : null}
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
  content: { padding: spacing.md, paddingBottom: 48, gap: spacing.md },
  desc: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  updated: { color: colors.textMuted, fontSize: 12 },
  section: { gap: 6 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  sectionBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
});
