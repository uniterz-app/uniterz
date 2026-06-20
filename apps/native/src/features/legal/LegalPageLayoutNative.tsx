import { ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  title: string;
  description?: string;
  updatedAt?: string;
  lastUpdatedLabel?: string;
  children: ReactNode;
};

/** Web `LegalPageLayout`（mobile variant）相当 */
export default function LegalPageLayoutNative({
  title,
  description,
  updatedAt,
  lastUpdatedLabel = "最終更新: ",
  children,
}: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.floatBtn}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="戻る"
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {updatedAt ? (
            <Text style={styles.updated}>
              {lastUpdatedLabel}
              {updatedAt}
            </Text>
          ) : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>

        <View style={styles.body}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0F17",
  },
  floatBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 52 : 44,
    right: 16,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(24,24,27,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 48,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  updated: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.6)",
  },
  body: {
    gap: 20,
  },
});
