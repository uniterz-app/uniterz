/**
 * Web `FloatingCloseButton` + sticky タイトルバー（`/mobile/*` 一覧系）に近いシェル。
 */
import { ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";

type Props = {
  title: string;
  onClose: () => void;
  /** 詳細などで左上に戻るだけのとき */
  onBack?: () => void;
  children: ReactNode;
};

export default function MobilePageShell({ title, onClose, onBack, children }: Props) {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.root, { width }]}>
      <View style={styles.bg} />
      <View style={styles.radial} pointerEvents="none" />

      <View style={styles.header}>
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            intensity={Platform.OS === "ios" ? 24 : 18}
            tint="dark"
            {...nativeBlurViewExtraProps()}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <LinearGradient
          colors={["rgba(10,17,24,0.92)", "rgba(10,17,24,0.78)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {onBack ? (
        <Pressable
          style={[styles.floatBtn, { left: 16, right: undefined }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="#f8fafc" />
        </Pressable>
      ) : (
        <Pressable
          style={[styles.floatBtn, { right: 16 }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color="#f8fafc" />
        </Pressable>
      )}

      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A1118",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F17",
  },
  radial: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
    backgroundColor: "transparent",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 52 : 44,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f8fafc",
    paddingHorizontal: 56,
  },
  floatBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(24,24,27,0.88)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  body: {
    flex: 1,
  },
});
