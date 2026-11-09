/**
 * expo-haptics の薄いラッパー。ネイティブモジュールが入っていないビルドでは何もしない。
 */
type HapticsModule = typeof import("expo-haptics");

let cached: HapticsModule | null | undefined;

function haptics(): HapticsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("expo-haptics") as HapticsModule;
  } catch {
    cached = null;
  }
  return cached;
}

export function hapticImpact(style: "light" | "medium" | "heavy" = "medium"): void {
  const h = haptics();
  if (!h) return;
  const map = {
    light: h.ImpactFeedbackStyle.Light,
    medium: h.ImpactFeedbackStyle.Medium,
    heavy: h.ImpactFeedbackStyle.Heavy,
  } as const;
  void h.impactAsync(map[style]).catch(() => {});
}

export function hapticSuccess(): void {
  const h = haptics();
  if (!h) return;
  void h.notificationAsync(h.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticSelection(): void {
  const h = haptics();
  if (!h) return;
  void h.selectionAsync().catch(() => {});
}
