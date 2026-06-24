import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveWcConcurrentStreakCopy } from "../../../../../lib/wc/wcConcurrentStreakNotice";
import type { GamesLanguage } from "./gamesI18n";

type Props = {
  visible: boolean;
  language: GamesLanguage;
  onClose: () => void;
};

export default function WcConcurrentStreakModalNative({
  visible,
  language,
  onClose,
}: Props) {
  const copy = resolveWcConcurrentStreakCopy(language);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.cta}
        />
        <View style={styles.card}>
          <Text style={styles.tag}>{copy.tag}</Text>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.lead}>{copy.lead}</Text>
          <View style={styles.divider} />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {copy.bullets.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>{copy.cta}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  card: {
    maxHeight: "88%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    backgroundColor: "#0a1018",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  tag: {
    textAlign: "center",
    color: "rgba(34,211,238,0.9)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 24,
  },
  lead: {
    marginTop: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 14,
  },
  scroll: { maxHeight: 280 },
  scrollContent: { paddingBottom: 4 },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  bullet: {
    color: "rgba(34,211,238,0.95)",
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(34,211,238,0.92)",
    paddingVertical: 13,
    alignItems: "center",
  },
  ctaBtnPressed: { opacity: 0.88 },
  ctaText: {
    color: "#041018",
    fontSize: 14,
    fontWeight: "800",
  },
});
