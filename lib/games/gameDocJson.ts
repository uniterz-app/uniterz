/**
 * games ドキュメントの Timestamp を JSON 往復できる形に変換 / 復元。
 * クライアントは Firestore SDK なしでも toDate() 相当で読める。
 */

export type SerializedTimestamp = { __ts: number };

function isAdminOrClientTimestamp(v: unknown): v is { toMillis: () => number } {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { toMillis?: unknown }).toMillis === "function"
  );
}

function isSerializedTimestamp(v: unknown): v is SerializedTimestamp {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as SerializedTimestamp).__ts === "number" &&
    Number.isFinite((v as SerializedTimestamp).__ts)
  );
}

/** API レスポンス用: Timestamp → { __ts: ms } */
export function serializeGameValue(value: unknown): unknown {
  if (value == null) return value;
  if (isAdminOrClientTimestamp(value)) {
    try {
      return { __ts: value.toMillis() } satisfies SerializedTimestamp;
    } catch {
      return null;
    }
  }
  if (value instanceof Date) {
    return { __ts: value.getTime() } satisfies SerializedTimestamp;
  }
  if (Array.isArray(value)) {
    return value.map(serializeGameValue);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // カード一覧では別 API（live-stats）を使う。ペイロード縮小。
      if (k === "liveStats") continue;
      out[k] = serializeGameValue(v);
    }
    return out;
  }
  return value;
}

export function serializeGameDoc(
  id: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    id,
    ...(serializeGameValue(data) as Record<string, unknown>),
  };
}

/** クライアント復元: { __ts } → toDate/toMillis を持つオブジェクト */
export function timestampLikeFromMs(ms: number): {
  toDate: () => Date;
  toMillis: () => number;
  seconds: number;
  nanoseconds: number;
} {
  return {
    toDate: () => new Date(ms),
    toMillis: () => ms,
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1_000_000,
  };
}

export function reviveGameValue(value: unknown): unknown {
  if (value == null) return value;
  if (isSerializedTimestamp(value)) {
    return timestampLikeFromMs(value.__ts);
  }
  if (Array.isArray(value)) {
    return value.map(reviveGameValue);
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = reviveGameValue(v);
    }
    return out;
  }
  return value;
}

export function reviveGameDoc(
  row: Record<string, unknown>
): Record<string, unknown> {
  return reviveGameValue(row) as Record<string, unknown>;
}

export function reviveGameDocs(
  rows: ReadonlyArray<Record<string, unknown>>
): Record<string, unknown>[] {
  return rows.map((r) => reviveGameDoc(r));
}
