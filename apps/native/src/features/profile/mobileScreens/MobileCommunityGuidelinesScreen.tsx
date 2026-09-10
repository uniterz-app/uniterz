/**
 * Web `CommunityGuidelinesPage` variant=mobile — `LegalPageLayout` 準拠
 */
import { StyleSheet, Text, View } from "react-native";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { communityGuidelinesCopy } from "../communityGuidelinesCopy";

type Props = {
  language: string;
};

export default function MobileCommunityGuidelinesScreen({ language }: Props) {
  const copy = communityGuidelinesCopy(language);
  const updatedAt = "2026-03-23";

  return (
    <LegalPageLayoutNative
      title="GUIDELINES"
      description={copy.description}
      updatedAt={updatedAt}
      lastUpdatedLabel={copy.lastUpdatedLabel}
    >
      <Section title={copy.s1Title} paragraphs={[...copy.s1Paragraphs]} />
      <Section title={copy.s2Title} bullets={[...copy.s2Bullets]} />
      <Section
        title={copy.s3Title}
        paragraphs={[...copy.s3Paragraphs]}
        bullets={[...copy.s3Bullets]}
      />
      <Section title={copy.s4Title} bullets={[...copy.s4Bullets]} />
      <Section
        title={copy.s5Title}
        paragraphs={[...copy.s5Paragraphs]}
        bullets={[...copy.s5Bullets]}
        paragraphsAfter={[...copy.s5After]}
      />
      <Section title={copy.s6Title} paragraphs={[...copy.s6Paragraphs]} />
    </LegalPageLayoutNative>
  );
}

function Section({
  title,
  paragraphs,
  bullets,
  paragraphsAfter,
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  paragraphsAfter?: string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {paragraphs?.map((p) => (
        <Text key={p} style={styles.p}>
          {p}
        </Text>
      ))}
      {bullets?.map((b) => (
        <Text key={b} style={styles.li}>
          {"• "}
          {b}
        </Text>
      ))}
      {paragraphsAfter?.map((p) => (
        <Text key={p} style={[styles.p, { marginTop: 8 }]}>
          {p}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  h2: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.9)", marginBottom: 4 },
  p: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.8)" },
  li: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.8)", paddingLeft: 4 },
});
