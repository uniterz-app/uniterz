/**
 * 起動スプラッシュ動画 — コールドスタート時のみ全画面再生し GamesTab へ渡す。
 * ロゴが見えているうちに透過し、単色板を挟まず試合ページへ溶かす。
 *
 * 注意: 親の再レンダーでタイマーを消さない（onDone / finish を effect 依存にしない）。
 * VideoView は iOS で親 opacity を無視しやすいので、rasterize + 完了保険を併用する。
 */
import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  hideNativeBootSplash,
  hideNativeBootSplashForVideo,
  setSplashVideoGateActive,
} from "../../../bootstrap/nativeBootSplash";
import {
  SPLASH_VIDEO_END_BG,
  UNITERZ_SPLASH_VIDEO,
} from "./splashVideoAsset";

/** ロゴホールド中から試合メッシュを透かす（約 f63 / 2.1s） */
const CROSSFADE_AT_MS = 2100;
const FADE_MS = 720;
const REDUCE_MOTION_HOLD_MS = 400;
const READY_TIMEOUT_MS = 2800;
const MAX_PLAY_MS = 4500;

type Props = {
  onDone: () => void;
};

export default function SplashVideoGateNative({ onDone }: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const finishingRef = useRef(false);
  const completedRef = useRef(false);
  const bootHiddenRef = useRef(false);
  const armedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crossfadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPlaybackTimers = useCallback(() => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
    if (crossfadeTimeoutRef.current) {
      clearTimeout(crossfadeTimeoutRef.current);
      crossfadeTimeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearPlaybackTimers();
    if (doneFallbackRef.current) {
      clearTimeout(doneFallbackRef.current);
      doneFallbackRef.current = null;
    }
    setSplashVideoGateActive(false);
    onDoneRef.current();
  }, [clearPlaybackTimers]);

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    clearPlaybackTimers();
    setSplashVideoGateActive(false);
    opacity.value = withTiming(0, { duration: FADE_MS }, (finished) => {
      if (finished) runOnJS(complete)();
    });
    // withTiming コールバックが飛ばない機種向け保険
    doneFallbackRef.current = setTimeout(() => {
      complete();
    }, FADE_MS + 120);
  }, [clearPlaybackTimers, complete, opacity]);

  const finishRef = useRef(finish);
  finishRef.current = finish;

  const armPlaybackTimers = useCallback(() => {
    if (armedRef.current || finishingRef.current) return;
    armedRef.current = true;
    crossfadeTimeoutRef.current = setTimeout(() => {
      finishRef.current();
    }, CROSSFADE_AT_MS);
    maxTimeoutRef.current = setTimeout(() => {
      finishRef.current();
    }, MAX_PLAY_MS);
  }, []);

  const player = useVideoPlayer(UNITERZ_SPLASH_VIDEO, (p) => {
    p.loop = false;
    p.muted = true;
    p.volume = 0;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "readyToPlay" && !bootHiddenRef.current) {
      bootHiddenRef.current = true;
      hideNativeBootSplashForVideo();
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
      armPlaybackTimers();
    }
    if (status === "error") {
      finishRef.current();
    }
  });

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    // 実再生位置で溶かし開始（ready 遅延で setTimeout がズレるのを防ぐ）
    if (currentTime >= CROSSFADE_AT_MS / 1000) {
      finishRef.current();
    }
  });

  useEventListener(player, "playToEnd", () => {
    finishRef.current();
  });

  useEffect(() => {
    if (reduceMotion === true) {
      setSplashVideoGateActive(false);
      hideNativeBootSplash();
      const t = setTimeout(() => {
        onDoneRef.current();
      }, REDUCE_MOTION_HOLD_MS);
      return () => clearTimeout(t);
    }
    if (reduceMotion == null) return;

    setSplashVideoGateActive(true);
    readyTimeoutRef.current = setTimeout(() => {
      if (finishingRef.current || completedRef.current) return;
      if (!bootHiddenRef.current) {
        bootHiddenRef.current = true;
        hideNativeBootSplashForVideo();
      }
      // ready が遅い／来ないときも試合へ進める
      finishRef.current();
    }, READY_TIMEOUT_MS);

    return () => {
      // アンマウント時だけ掃除。依存更新では走らせない
      clearPlaybackTimers();
      if (doneFallbackRef.current) {
        clearTimeout(doneFallbackRef.current);
        doneFallbackRef.current = null;
      }
      setSplashVideoGateActive(false);
    };
    // reduceMotion の確定時だけ。finish/onDone を入れない（親再レンダーでタイマー消去するのを防ぐ）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (reduceMotion === true) {
    return (
      <View
        style={[styles.root, { backgroundColor: SPLASH_VIDEO_END_BG }]}
        pointerEvents="none"
      />
    );
  }

  if (reduceMotion !== false) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => finishRef.current()}
        accessibilityRole="button"
        accessibilityLabel="スキップ"
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, animStyle]}
          // VideoView の opacity 無視を緩和（合成レイヤにする）
          needsOffscreenAlphaCompositing
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
        >
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
    backgroundColor: "transparent",
  },
});
