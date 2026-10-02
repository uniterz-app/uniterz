/**
 * Web モバイルページをフルスクリーン表示。戻りは右端 BACK タブ。
 */
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useState } from "react";
import { WebView } from "react-native-webview";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";

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
      <ProfileBackEdgeHandleNative onPress={() => navigation.goBack()} />
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
});
