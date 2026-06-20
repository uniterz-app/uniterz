/**
 * Web の公開モバイルページをそのまま表示（ヘルプ・規約・お問い合わせ）。
 */
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import MobilePageShell from "./MobilePageShell";

type Props = {
  apiBase: string;
  /** `/mobile/help` のようなパス */
  path: string;
  title: string;
  onClose: () => void;
};

export default function MobileLegalWebViewScreen({
  apiBase,
  path,
  title,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const uri = `${apiBase.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  return (
    <MobilePageShell title={title} onClose={onClose}>
      <View style={styles.flex}>
        {loading ? (
          <View style={styles.loader}>
            <CandleChartLoaderNative />
          </View>
        ) : null}
        <WebView
          source={{ uri }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={styles.web}
        />
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0A1118" },
  web: { flex: 1, backgroundColor: "transparent" },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: "rgba(10,17,24,0.4)",
  },
});
