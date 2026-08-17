/**
 * Firestore / gRPC の一時障害かどうか。
 * 例: `14 UNAVAILABLE: No connection established. ... ECONNRESET`
 */
export function isTransientFirestoreError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const code =
    typeof error === "object" &&
    error != null &&
    "code" in error &&
    (typeof (error as { code?: unknown }).code === "number" ||
      typeof (error as { code?: unknown }).code === "string")
      ? String((error as { code: number | string }).code)
      : "";

  if (
    code === "14" ||
    code === "UNAVAILABLE" ||
    code === "4" ||
    code === "DEADLINE_EXCEEDED" ||
    code === "8" ||
    code === "RESOURCE_EXHAUSTED"
  ) {
    return true;
  }

  return /UNAVAILABLE|ECONNRESET|ECONNREFUSED|ETIMEDOUT|DEADLINE_EXCEEDED|RST_STREAM|GOAWAY|socket hang up/i.test(
    msg
  );
}

/** 一時障害時だけ短い待機のあと再実行する */
export async function withFirestoreTransientRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 200;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isTransientFirestoreError(error)) {
        throw error;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * (attempt + 1))
      );
    }
  }

  throw lastError;
}
