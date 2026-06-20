import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../../navigation/types";

/** 旧ルート互換 — プロフィール編集モーダルへ誘導 */
export default function ProfileSettingsScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  useEffect(() => {
    navigation.replace("ProfileHome", { openSettings: true });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color="#67e8f9" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
});
