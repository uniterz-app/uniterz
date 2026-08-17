/**
 * expo-gl では R3F 既定 rAF だけでは update が進まないことがある。
 * frameloop="never" と組み合わせ、毎フレーム advance する。
 */
import { advance } from "@react-three/fiber/native";
import { useLayoutEffect } from "react";

export default function ExpoGlR3fFrameDriverNative() {
  useLayoutEffect(() => {
    advance(performance.now() / 1000);
    let raf = 0;
    const tick = () => {
      advance(performance.now() / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}
