/** Web `composeBrandedRankCard` 相当 — 共有 PNG の上端にアーチなし UNITERZ ロゴを載せる */
import { Image, StyleSheet, View } from "react-native";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../lib/units/uniterzLogoFlat";
import { SHARE_CAPTURE_BG } from "./shareImageNative";

const LOGO_FLAT = require("../../../assets/brand/uniterz-logo-flat.png");
const LOGO_W = 120;
const LOGO_H = (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;

type Props = {
  /** キャプチャ直前のみ true — 通常は画面に出さない */
  visible?: boolean;
};

export default function ShareBrandCaptureHeaderNative({ visible = false }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <Image
        source={LOGO_FLAT}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="UNITERZ"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    /** 透明だと写真アプリで白落ちしロゴが消える */
    backgroundColor: SHARE_CAPTURE_BG,
    paddingHorizontal: 12,
    paddingTop: 12,
    /** リザルト枠の上辺ラベルが枠外へ 10px はみ出す分を空ける */
    paddingBottom: 18,
    alignItems: "center",
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
});
