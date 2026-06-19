import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { colors } from "../../theme/tokens";

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
        <View style={styles.headerBlock}>
          {updatedAt ? <Text style={styles.updated}>最終更新: {updatedAt}</Text> : null}
          {description ? <Text style={styles.desc}>{description}</Text> : null}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 64,
    gap: 20,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 4,
  },
  desc: { color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 22 },
  updated: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  section: { gap: 6 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  sectionBody: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 22 },
});
