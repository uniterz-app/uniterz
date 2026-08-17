/**
 * 認証起動の expo-gl + R3F Canvas。
 * SplashCameraCanvasNative と同じ対策:
 * frameloop never + FrameDriver、ErrorBoundary なし、進捗は rAF。
 */
import { advance, Canvas, useFrame } from "@react-three/fiber/native";
import {
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { getSplashCamera3dMeta } from "@/lib/splash/camera3dPaths";
import ExpoGlR3fFrameDriverNative from "../../splash/legacy/camera3d/ExpoGlR3fFrameDriverNative";
import {
  SplashProgressCtx,
  type SplashProgressRef,
} from "../../splash/legacy/camera3d/SplashProgressContextNative";
import AuthFieldSceneNative from "./AuthFieldSceneNative";
import AuthLandingCameraRigNative from "./AuthLandingCameraRigNative";
import { AUTH_LANDING } from "../authLandingPalette";

export type AuthLandingGlCanvasNativeProps = {
  flying: boolean;
  onProgress?: (t01: number) => void;
  onUnavailable?: () => void;
};

function isExpoGLNativeLinked(): boolean {
  try {
    requireNativeModule("ExponentGLObjectManager");
    return true;
  } catch {
    return false;
  }
}

function ProgressBridge({
  onProgressRef,
  progressRef,
}: {
  onProgressRef: MutableRefObject<((t01: number) => void) | undefined>;
  progressRef: SplashProgressRef;
}) {
  const lastEmit = useRef(0);

  useFrame(() => {
    const t = progressRef.current;
    const now = performance.now();
    if (now - lastEmit.current < 80 && t > 0.01 && t < 0.999) return;
    lastEmit.current = now;
    const emit = onProgressRef.current;
    if (!emit) return;
    requestAnimationFrame(() => {
      emit(t);
    });
  });

  return null;
}

type CanvasViewProps = {
  flying: boolean;
  reducedMotion: boolean;
  onProgressRef: MutableRefObject<((t01: number) => void) | undefined>;
};

const AuthLandingGlCanvasView = memo(function AuthLandingGlCanvasView({
  flying,
  reducedMotion,
  onProgressRef,
}: CanvasViewProps) {
  const meta = getSplashCamera3dMeta("authField");
  const progressRef = useMemo<SplashProgressRef>(() => ({ current: 0 }), []);

  return (
    <View
      style={styles.root}
      collapsable={false}
      pointerEvents="none"
      accessibilityLabel="認証フィールド"
    >
      <SplashProgressCtx.Provider value={progressRef}>
        <Canvas
          style={styles.canvas}
          frameloop="never"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{
            position: [0, 4.4, 11.2],
            fov: meta.fovStart,
            near: 0.1,
            far: 80,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(AUTH_LANDING.void, 0);
            advance(performance.now() / 1000);
          }}
        >
          <Suspense fallback={null}>
            <ExpoGlR3fFrameDriverNative />
            <ProgressBridge
              onProgressRef={onProgressRef}
              progressRef={progressRef}
            />
            <AuthLandingCameraRigNative
              flying={flying}
              reducedMotion={reducedMotion}
              onProgress={(t) => {
                progressRef.current = t;
              }}
            />
            <AuthFieldSceneNative />
          </Suspense>
        </Canvas>
      </SplashProgressCtx.Provider>
    </View>
  );
});

export default function AuthLandingGlCanvasNative({
  flying,
  onProgress,
  onUnavailable,
}: AuthLandingGlCanvasNativeProps) {
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [available, setAvailable] = useState(() => isExpoGLNativeLinked());

  useEffect(() => {
    if (!available) onUnavailable?.();
  }, [available, onUnavailable]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReducedMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  if (!available) return null;

  return (
    <AuthLandingGlCanvasView
      flying={flying}
      reducedMotion={reducedMotion}
      onProgressRef={onProgressRef}
    />
  );
}

/** シェル側の事前判定用 */
export { isExpoGLNativeLinked };

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});
