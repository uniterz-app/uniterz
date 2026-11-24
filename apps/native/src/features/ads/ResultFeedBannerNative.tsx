/**
 * リザルトカードのあいだに出すバナー。画面近傍になるまでリクエストしない。
 * 読み込み失敗・SDK なし・同意不可は枠ごと消す（空箱を残さない）。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useNearViewportNative } from "../games/ScrollVisibilityNative";
import {
  MOBILE_RESULT_CARD_GAP,
  MOBILE_RESULT_CARD_MAX_W,
  MOBILE_RESULT_LIST_PAD_X,
} from "../results/resultMobileUiNative";
import { ensureAdsReadyNative, loadAdsModuleNative } from "./adsConsentNative";
import { resultFeedBannerUnitId } from "./resultFeedAdPlacementNative";

/** インライン適応バナーの上限。カードより低く抑える */
const BANNER_MAX_H = 100;

export default function ResultFeedBannerNative({
  compactSpacing = false,
}: {
  compactSpacing?: boolean;
}) {
  const hostRef = useRef<View>(null);
  const { near, onLayout } = useNearViewportNative(hostRef);
  const screenW = useWindowDimensions().width;
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (near) setArmed(true);
  }, [near]);

  useEffect(() => {
    if (!armed || failed) return;
    let cancelled = false;
    void ensureAdsReadyNative().then((ok) => {
      if (cancelled) return;
      if (ok) setReady(true);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [armed, failed]);

  const ads = ready && !failed ? loadAdsModuleNative() : null;
  useEffect(() => {
    if (ready && !ads) setFailed(true);
  }, [ads, ready]);

  const unitId = useMemo(() => {
    if (!ads) return "";
    return resultFeedBannerUnitId(ads.TestIds.ADAPTIVE_BANNER);
  }, [ads]);

  const width = Math.max(
    1,
    Math.floor(
      Math.min(MOBILE_RESULT_CARD_MAX_W, screenW - MOBILE_RESULT_LIST_PAD_X * 2)
    )
  );

  if (failed) return null;

  const Banner = ads?.BannerAd;
  const size = ads?.BannerAdSize.INLINE_ADAPTIVE_BANNER;

  return (
    <View
      ref={hostRef}
      onLayout={onLayout}
      style={[styles.wrap, compactSpacing ? styles.wrapCompact : null]}
      pointerEvents={loaded ? "auto" : "none"}
    >
      {loaded ? <Text style={styles.adLabel}>AD</Text> : null}
      {Banner && size && unitId ? (
        <Banner
          unitId={unitId}
          size={size}
          width={width}
          maxHeight={BANNER_MAX_H}
          onAdLoaded={() => setLoaded(true)}
          onAdFailedToLoad={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: MOBILE_RESULT_CARD_MAX_W,
    marginBottom: MOBILE_RESULT_CARD_GAP,
    overflow: "hidden",
  },
  wrapCompact: {
    marginBottom: 0,
  },
  adLabel: {
    alignSelf: "flex-start",
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(226,232,240,0.55)",
  },
});
