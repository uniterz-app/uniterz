/**
 * Web モバイルページをフルスクリーン表示（FloatingCloseButton は Web 側）。
 */
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useState } from "react";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  apiBase: string;
  /** `/mobile/terms` など */
  path: string;
};

export default function MobileLegalWebViewScreenNative({ apiBase, path }: Props) {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const uri = `${apiBase.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#67e8f9" />
        </View>
      ) : null}
      <WebView
        source={{ uri }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={styles.web}
      />
      <Pressable
        style={styles.fallbackClose}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0F17" },
  web: { flex: 1, backgroundColor: "#0B0F17" },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: "rgba(11,15,23,0.85)",
  },
  fallbackClose: {
    position: "absolute",
    top: 52,
    right: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(24,24,27,0.8)",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.01,
    width: 1,
    height: 1,
  },
});
