/** Web `composeBrandedRankCard` 相当 — PNG 内に URL を控えめに表示（区切り線なし） */
import { StyleSheet, Text, View } from "react-native";
import { formatShareLinkDisplay } from "../../../../../lib/share/shareAppUrls";

type Props = {
  url: string;
  /** キャプチャ直前のみ true — 通常は画面に出さない */
  visible?: boolean;
};

export default function ShareLinkCaptureFooterNative({
  url,
  visible = false,
}: Props) {
  if (!url.trim()) return null;

  return (
    <View style={[styles.wrap, !visible && styles.wrapHidden]}>
      <Text style={styles.text} numberOfLines={1}>
        {formatShareLinkDisplay(url)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
    alignItems: "center",
  },
  wrapHidden: {
    height: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    opacity: 0,
    overflow: "hidden",
  },
  text: {
    fontSize: 10,
    letterSpacing: 0.3,
    color: "rgba(140,240,255,0.55)",
    includeFontPadding: false,
  },
});
