/**
 * 認証フィールド用カメラ — flying で progress 0↔1。
 * スプラッシュと違い自動再生せず、CTA / BACK で進退する。
 * Rest 中は数 cm のドリフトのみ（周回しない）。
 */
import { useFrame, useThree } from "@react-three/fiber/native";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  easeOutExpo,
  getSplashCamera3dCurves,
  getSplashCamera3dMeta,
  smoothstep,
} from "@/lib/splash/camera3dPaths";
import { TUTORIAL_WELCOME_FLY_S } from "@/lib/tutorial/tutorialMotion";

export type AuthLandingCameraRigNativeProps = {
  flying: boolean;
  reducedMotion: boolean;
  onProgress?: (t01: number) => void;
};

export default function AuthLandingCameraRigNative({
  flying,
  reducedMotion,
  onProgress,
}: AuthLandingCameraRigNativeProps) {
  const { camera } = useThree();
  const meta = getSplashCamera3dMeta("authField");
  const curves = useMemo(() => getSplashCamera3dCurves("authField"), []);
  const progressRef = useRef(0);
  const animFromRef = useRef(0);
  const animToRef = useRef(0);
  const animStartedAtRef = useRef<number | null>(null);
  const lastFlyingRef = useRef(flying);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const lookAhead = useMemo(() => new THREE.Vector3(), []);
  const logoTarget = useMemo(
    () => new THREE.Vector3(...meta.logoLookAt),
    [meta.logoLookAt]
  );
  const drift = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const now = performance.now();
    const target = flying ? 1 : 0;

    if (lastFlyingRef.current !== flying) {
      lastFlyingRef.current = flying;
      animFromRef.current = progressRef.current;
      animToRef.current = target;
      animStartedAtRef.current = now;
    }

    if (reducedMotion) {
      progressRef.current = target;
      curves.position.getPointAt(target, pos);
      look.copy(logoTarget);
      camera.position.copy(pos);
      camera.lookAt(look);
      if ("fov" in camera) {
        const persp = camera as THREE.PerspectiveCamera;
        persp.fov = target >= 1 ? meta.fovEnd : meta.fovStart;
        persp.updateProjectionMatrix();
      }
      onProgress?.(progressRef.current);
      return;
    }

    if (animStartedAtRef.current != null) {
      const elapsed = (now - animStartedAtRef.current) / 1000;
      const raw = Math.min(1, Math.max(0, elapsed / TUTORIAL_WELCOME_FLY_S));
      const eased = easeOutExpo(raw);
      progressRef.current =
        animFromRef.current +
        (animToRef.current - animFromRef.current) * eased;
      if (raw >= 1) {
        progressRef.current = animToRef.current;
        animStartedAtRef.current = null;
      }
    }

    const t = progressRef.current;
    curves.position.getPointAt(t, pos);
    const lookT = Math.min(1, t + 0.055);
    curves.lookAt.getPointAt(lookT, lookAhead);
    const blend = smoothstep(meta.lookAtBlendFrom, 1, t);
    look.lerpVectors(lookAhead, logoTarget, blend);

    // Rest のみ軽いドリフト（ドック中は止める）
    if (t < 0.04) {
      const s = now / 1000;
      drift.set(Math.sin(s * 0.28) * 0.06, Math.sin(s * 0.22) * 0.035, 0);
      pos.add(drift);
    }

    camera.position.copy(pos);
    camera.lookAt(look);

    if ("fov" in camera) {
      const fov =
        meta.fovStart + (meta.fovEnd - meta.fovStart) * smoothstep(0.25, 1, t);
      const persp = camera as THREE.PerspectiveCamera;
      if (Math.abs(persp.fov - fov) > 0.05) {
        persp.fov = fov;
        persp.updateProjectionMatrix();
      }
    }

    onProgress?.(t);
  });

  return null;
}
