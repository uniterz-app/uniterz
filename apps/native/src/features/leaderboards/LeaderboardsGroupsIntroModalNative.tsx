import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LEADERBOARDS_GROUPS_INTRO_EVENT } from "../../../../../lib/events/leaderboardsGroupsIntro";
import { resolveEventNoticeCopy } from "../../../../../lib/events/resolveEventNoticeCopy";
import type { Language } from "../../../../../lib/i18n/language";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";

type Props = {
  visible: boolean;
  language: Language;
  onClose: () => void;
};

export default function LeaderboardsGroupsIntroModalNative({ visible, language, onClose }: Props) {
  const copy = resolveEventNoticeCopy(LEADERBOARDS_GROUPS_INTRO_EVENT, language);
  const heroSrc = LEADERBOARDS_GROUPS_INTRO_EVENT.heroImageURL?.trim();
  const heroUri = heroSrc?.startsWith("http")
    ? heroSrc
    : heroSrc
      ? `https://uniterz.app${heroSrc}`
      : null;

  return (
    <CommunityModalBackdropNative visible={visible} onClose={onClose}>
      {heroUri ? (
        <Image source={{ uri: heroUri }} style={styles.hero} resizeMode="cover" />
      ) : null}
      <Text style={styles.tag}>{copy.tag}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.description}</Text>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>{language === "en" ? "When" : "期間"}</Text>
        <Text style={styles.metaValue}>{copy.period}</Text>
      </View>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>{language === "en" ? "How" : "対象"}</Text>
        <Text style={styles.metaValue}>{copy.target}</Text>
      </View>
      <Pressable onPress={onClose} style={({ pressed }) => [styles.okBtn, pressed && { opacity: 0.88 }]}>
        <Text style={styles.okText}>OK</Text>
      </Pressable>
    </CommunityModalBackdropNative>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  tag: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(34,211,238,0.9)",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(248,250,252,0.96)",
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.72)",
    marginBottom: 14,
  },
  metaBlock: {
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  metaValue: {
    marginTop: 2,
    fontSize: 13,
    color: "rgba(255,255,255,0.82)",
  },
  okBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.12)",
    paddingVertical: 12,
    alignItems: "center",
  },
  okText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(236,254,255,0.95)",
  },
});
