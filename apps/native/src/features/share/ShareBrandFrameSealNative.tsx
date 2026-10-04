/**
 * 共有 PNG 用 — 線枠の上辺に UNITERZ ロゴをはめ込む（線をロゴ幅だけ切って見せる）。
 * My Rank は上辺中央、リザルトは上辺右（中央〜左はラウンドラベル）。
 */
import type { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../lib/units/uniterzLogoFlat";
import { SHARE_CAPTURE_BG } from "./shareImageNative";

const LOGO_FLAT = require("../../../assets/brand/uniterz-logo-flat.png");
/** 線のグロー（5px）より厚く取り、切れ目に光が残らないようにする */
const SEAL_H = 28;
const SEAL_PAD_X = 12;
/** 右寄せ時の枠右端からの距離（ロゴ右端 ≒ 枠内 20px） */
const SEAL_END_INSET = 8;

type Props = {
  /** キャプチャ直前のみ true — 通常は何も足さない */
  visible?: boolean;
  align?: "center" | "end";
  /** 子の最上端から線枠の上辺までの距離（MatchListLineFrame 非 flush は 14） */
  edgeOffset?: number;
  logoWidth?: number;
  children: ReactNode;
};

export default function ShareBrandFrameSealNative({
  visible = false,
  align = "center",
  edgeOffset = 0,
  logoWidth = 128,
  children,
}: Props) {
  /** ロゴ上半分がキャプチャ外へはみ出さない余白 */
  const room = Math.max(0, SEAL_H / 2 + 8 - edgeOffset);
  const logoH = (logoWidth * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;

  return (
    <View style={visible && room > 0 ? { paddingTop: room } : undefined}>
      {children}
      {visible ? (
        <View
          pointerEvents="none"
          style={[
            styles.sealRow,
            { top: room + edgeOffset - SEAL_H / 2 },
            align === "end" ? styles.sealRowEnd : null,
          ]}
        >
          <View style={styles.seal}>
            <Image
              source={LOGO_FLAT}
              style={{ width: logoWidth, height: logoH }}
              resizeMode="contain"
              accessibilityLabel="UNITERZ"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sealRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SEAL_H,
    alignItems: "center",
    zIndex: 10,
  },
  sealRowEnd: {
    alignItems: "flex-end",
    paddingRight: SEAL_END_INSET,
  },
  seal: {
    height: SEAL_H,
    paddingHorizontal: SEAL_PAD_X,
    justifyContent: "center",
    backgroundColor: SHARE_CAPTURE_BG,
  },
});
