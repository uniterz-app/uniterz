/**
 * 共有 PNG 用 — 線枠の上辺中央に UNITERZ ロゴをはめ込む（線をロゴ幅だけ切って見せる）。
 * 子の最上端に線枠の上辺がある前提（flush な My Rank 枠など）。
 */
import type { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../lib/units/uniterzLogoFlat";
import { SHARE_CAPTURE_BG } from "./shareImageNative";

const LOGO_FLAT = require("../../../assets/brand/uniterz-logo-flat.png");
const LOGO_W = 128;
const LOGO_H = (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;
/** 線のグロー（5px）より厚く取り、切れ目に光が残らないようにする */
const SEAL_H = 28;
/** ロゴ上半分がキャプチャ外へはみ出さない余白 */
const TOP_ROOM = SEAL_H / 2 + 8;

type Props = {
  /** キャプチャ直前のみ true — 通常は何も足さない */
  visible?: boolean;
  children: ReactNode;
};

export default function ShareBrandFrameSealNative({ visible = false, children }: Props) {
  return (
    <View style={visible ? styles.roomTop : undefined}>
      {children}
      {visible ? (
        <View pointerEvents="none" style={styles.sealRow}>
          <View style={styles.seal}>
            <Image
              source={LOGO_FLAT}
              style={styles.logo}
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
  roomTop: {
    paddingTop: TOP_ROOM,
  },
  sealRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: TOP_ROOM - SEAL_H / 2,
    height: SEAL_H,
    alignItems: "center",
    zIndex: 10,
  },
  seal: {
    height: SEAL_H,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: SHARE_CAPTURE_BG,
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },
});
