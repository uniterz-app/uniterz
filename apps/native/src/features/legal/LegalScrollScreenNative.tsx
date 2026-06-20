import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import LegalPageLayoutNative from "./LegalPageLayoutNative";

type Section = { title: string; body: string };

type Props = {
  title: string;
  description?: string;
  updatedAt?: string;
  sections: Section[];
  children?: ReactNode;
  language?: "ja" | "en";
};

export default function LegalScrollScreenNative({
  title,
  description,
  updatedAt,
  sections,
  children,
  language = "ja",
}: Props) {
  const lastUpdatedLabel = language === "en" ? "Last updated: " : "最終更新: ";

  return (
    <LegalPageLayoutNative
      title={title}
      description={description}
      updatedAt={updatedAt}
      lastUpdatedLabel={lastUpdatedLabel}
    >
      {sections.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.sectionBody}>{s.body}</Text>
        </View>
      ))}
      {children}
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionBody: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 22 },
});
