/**
 * クライアント向け軽量 analytics / 診断イベント。
 * 本番プロバイダ（Sentry / GA / PostHog 等）は env が揃うまで no-op。
 * 課金・PII を載せないこと。
 */

export type AppAnalyticsEvent =
  | { name: "app_open"; props?: { surface: "web" | "native" } }
  | { name: "predict_submit"; props?: { league?: string; ok: boolean } }
  | { name: "push_token_register"; props?: { ok: boolean } }
  | { name: "stats_empty"; props?: { kind: "team" | "player"; season?: string } }
  | { name: "error_boundary"; props?: { where: string } };

type Sink = (event: AppAnalyticsEvent) => void;

const sinks: Sink[] = [];

export function registerAppAnalyticsSink(sink: Sink): () => void {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) sinks.splice(i, 1);
  };
}

export function trackAppEvent(event: AppAnalyticsEvent): void {
  if (
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development"
  ) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event.name, event.props ?? {});
  }
  for (const sink of sinks) {
    try {
      sink(event);
    } catch {
      /* ignore sink errors */
    }
  }
}

/** 本番で Sentry 等を足すまでの最低限のエラー記録口 */
export function reportAppError(
  where: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const message = error instanceof Error ? error.message : String(error);
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(`[app-error:${where}]`, message, extra ?? {});
  }
  trackAppEvent({ name: "error_boundary", props: { where } });
}
