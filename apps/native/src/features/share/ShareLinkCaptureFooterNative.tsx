/** Web `composeBrandedRankCard` 相当 — PNG 内に URL を控えめに表示（区切り線なし） */
import { StyleSheet, Text, View } from "react-native";
import { formatShareLinkDisplay } from "../../../../../lib/share/shareAppUrls";
import { SHARE_CAPTURE_BG } from "./shareImageNative";

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
    /** 透明だと写真アプリで白落ちし URL が消える */
    backgroundColor: SHARE_CAPTURE_BG,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "center",
  },
  wrapHidden: {
    height: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    opacity: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  text: {
    fontSize: 11,
    letterSpacing: 0.35,
    color: "rgba(165,243,252,0.88)",
    includeFontPadding: false,
  },
});
