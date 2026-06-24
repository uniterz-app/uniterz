/** グループ詳細 — 画像上の「一覧へ」戻るヘッダー */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Language } from "../../../../../lib/i18n/language";
import { communityGroupListBackLabel } from "../../../../../lib/communities/communityGroupShell";
import {
  COMMUNITY_GROUP_HERO_BG,
  COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT,
} from "../../../../../lib/communities/communityGroupHeroLayout";
import { communityMono, communityPressableTapStyle } from "./communityCrtThemeNative";

type Props = {
  language: Language;
  onPress: () => void;
};

export default function CommunityGroupListBackHeaderNative({ language, onPress }: Props) {
  const label = communityGroupListBackLabel(language);

  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.btn, pressed && communityPressableTapStyle(true)]}
      >
        <MaterialCommunityIcons name="chevron-left" size={20} color="rgba(186,230,253,0.9)" />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: COMMUNITY_GROUP_LIST_BACK_HEADER_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: COMMUNITY_GROUP_HERO_BG,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,211,238,0.12)",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
    paddingVertical: 4,
    paddingRight: 10,
  },
  label: {
    fontFamily: communityMono,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.4,
    color: "rgba(186,230,253,0.9)",
  },
});
