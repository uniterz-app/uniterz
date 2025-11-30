/* lib/useSplashBackground.ts */
"use client";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export function useSplashBackground() {
  const { status } = useFirebaseUser();
  return status === "loading"; // ← 初回読み込み時だけ true
}
