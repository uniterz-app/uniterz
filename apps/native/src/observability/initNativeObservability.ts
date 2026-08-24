/**
 * Native 観測性の起動フック。
 * Sentry DSN 未設定時は no-op。DSN 設定後に `@sentry/react-native` を入れて差し替える。
 */
import { trackAppEvent } from "@/lib/observability/trackAppEvent";

export function initNativeObservability(): void {
  trackAppEvent({ name: "app_open", props: { surface: "native" } });

  const dsn =
    typeof process !== "undefined"
      ? process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()
      : "";
  if (!dsn) return;

  // DSN があるのに SDK 未導入のときだけ気づけるようにする（本番ビルドでは黙る）
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      "[observability] EXPO_PUBLIC_SENTRY_DSN is set but Sentry SDK is not wired yet. Add @sentry/react-native and init here."
    );
  }
}
