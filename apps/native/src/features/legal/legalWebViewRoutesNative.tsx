import { View, StyleSheet, Text } from "react-native";
import MobileLegalWebViewScreenNative from "./MobileLegalWebViewScreenNative";
import LegalPageLayoutNative from "./LegalPageLayoutNative";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type LegalWebProps = {
  path: string;
  fallbackTitle: string;
  fallbackDescription?: string;
  fallbackBody: string;
  updatedAt?: string;
};

/** apiBase があるとき Web ページをそのまま表示、なければネイティブ fallback */
export function LegalWebOrNativeScreen({
  path,
  fallbackTitle,
  fallbackDescription,
  fallbackBody,
  updatedAt,
}: LegalWebProps) {
  if (API_BASE) {
    return <MobileLegalWebViewScreenNative apiBase={API_BASE} path={path} />;
  }

  return (
    <LegalPageLayoutNative
      title={fallbackTitle}
      description={fallbackDescription}
      updatedAt={updatedAt}
    >
      <View style={styles.body}>
        <Text style={styles.text}>{fallbackBody}</Text>
        <Text style={styles.hint}>
          完全な内容を表示するには EXPO_PUBLIC_UNITERZ_API_BASE_URL を設定してください。
        </Text>
      </View>
    </LegalPageLayoutNative>
  );
}

export function useLegalApiBaseOrAlert(): string | null {
  if (API_BASE) return API_BASE;
  return null;
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  text: { fontSize: 14, lineHeight: 22, color: "rgba(255,255,255,0.8)" },
  hint: { fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8 },
});
