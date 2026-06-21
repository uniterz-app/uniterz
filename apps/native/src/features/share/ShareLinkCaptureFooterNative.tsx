/** Web `composeBrandedRankCard` 相当 — PNG 内にタップ可能な URL を視覚表示 */
import { StyleSheet, Text, View } from "react-native";
import { formatShareLinkDisplay } from "../../../../../lib/share/shareAppUrls";

type Props = {
  url: string;
};

export default function ShareLinkCaptureFooterNative({ url }: Props) {
  if (!url.trim()) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text} numberOfLines={1}>
        {formatShareLinkDisplay(url)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.22)",
    backgroundColor: "#070c18",
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  text: {
    color: "rgba(103,232,249,0.88)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.6,
    fontFamily: "Oxanium_700Bold",
  },
});
