import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { UNITERZ_LOGO_FLAT_ASSET } from "../../../../../../lib/units/uniterzLogoFlat";
import { cyberAlert } from "../../../components/cyberAlert";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import {
  SHARE_CAPTURE_BG,
  captureViewAsPngNative,
  shareImageUriNative,
} from "../../share/shareImageNative";
import { HubSection, type HubLang } from "./leagueHubUiNative";

const LOGO_FLAT = require("../../../../assets/brand/uniterz-logo-flat.png");
const LOGO_W = 92;
const LOGO_H = (LOGO_W * UNITERZ_LOGO_FLAT_ASSET.height) / UNITERZ_LOGO_FLAT_ASSET.width;

const HubCaptureContext = createContext(false);

/** 共有 PNG を撮っている最中は true。切り替え・検索などの操作 UI を隠す */
export function useHubCapturing(): boolean {
  return useContext(HubCaptureContext);
}

const waitNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/** `HubSection` + 見出し右の共有ボタン。押すとロゴ・シーズン・日付を足した PNG だけを共有する */
export default function HubShareSectionNative({
  title,
  hint,
  stamp,
  lang,
  children,
}: {
  title: string;
  hint?: string;
  /** 画像右上（例: NBA 2025-26 · 11/9） */
  stamp: string;
  lang: HubLang;
  children: ReactNode;
}) {
  const ref = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);

  const share = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    let uri: string | null = null;
    try {
      await waitNextPaint();
      uri = await captureViewAsPngNative(ref);
    } catch {
      uri = null;
    } finally {
      setCapturing(false);
    }
    const result = uri ? await shareImageUriNative(uri) : "failed";
    if (result === "failed") {
      cyberAlert("", lang === "ja" ? "画像を共有できませんでした" : "Couldn't share the image");
    }
  }, [capturing, lang]);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={capturing ? styles.capture : undefined}
    >
      {capturing ? (
        <View style={styles.brandRow}>
          <Image
            source={LOGO_FLAT}
            style={{ width: LOGO_W, height: LOGO_H, tintColor: "#ffffff" }}
            resizeMode="contain"
            accessibilityLabel="UNITERZ"
          />
          <Text style={styles.stamp}>{stamp}</Text>
        </View>
      ) : null}
      <HubCaptureContext.Provider value={capturing}>
        <HubSection
          title={title}
          hint={hint}
          right={
            capturing ? null : (
              <Pressable
                onPress={() => void share()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={lang === "ja" ? `${title} を画像で共有` : `Share ${title}`}
                style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
              >
                <MaterialCommunityIcons name="share-variant" size={15} color={CYBER_TAB_CYAN} />
              </Pressable>
            )
          }
        >
          {children}
        </HubSection>
      </HubCaptureContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  capture: {
    backgroundColor: SHARE_CAPTURE_BG,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stamp: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
