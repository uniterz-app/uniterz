import { ScrollView, StyleSheet, Text } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors } from "../../../theme/tokens";

export default function AnnouncementDetailScreenNative() {
  const route = useRoute<RouteProp<ProfileStackParamList, "AnnouncementDetail">>();
  const navigation = useNavigation();
  const { id } = route.params;

  return (
    <MobilePageShell title="お知らせ" onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.id}>ID: {id}</Text>
        <Text style={styles.body}>お知らせ詳細（Firestore から取得）</Text>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  id: { color: colors.textMuted, fontSize: 12 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 24 },
});
