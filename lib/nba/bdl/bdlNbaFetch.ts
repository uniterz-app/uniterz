import { requireBdlNbaApiKey } from "@/lib/nba/bdl/bdlNbaEnv";

const BDL_ROOT = "https://api.balldontlie.io";

export type BdlListMeta = {
  next_cursor?: number | null;
  per_page?: number;
};

export type BdlListResponse<T> = {
  data: T[];
  meta?: BdlListMeta;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * BDL GET。429 時は短くリトライ。
 * `path` は `/nba/v1/...` または `/v1/...`。
 */
export type BdlQueryValue =
  | string
  | number
  | boolean
  | ReadonlyArray<string | number>
  | undefined
  | null;

export async function bdlNbaGetJson<T>(
  path: string,
  query: Record<string, BdlQueryValue> = {}
): Promise<T> {
  const key = requireBdlNbaApiKey();
  const url = new URL(path.startsWith("http") ? path : `${BDL_ROOT}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item == null || item === "") continue;
        url.searchParams.append(k, String(item));
      }
      continue;
    }
    url.searchParams.set(k, String(v));
  }

  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: key,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    lastStatus = res.status;
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterSec = retryAfterHeader ? parseFloat(retryAfterHeader) : null;
      const waitMs =
        retryAfterSec && Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? Math.ceil(retryAfterSec * 1000)
          : Math.min(10000, 1000 * Math.pow(1.8, attempt) + Math.random() * 500);
      await sleep(waitMs);
      continue;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`BDL ${res.status} ${path}: ${text.slice(0, 240)}`);
    }
    return (await res.json()) as T;
  }
  throw new Error(`BDL rate limited after retries (${lastStatus}) ${path}`);
}

/** cursor ページを最後まで読む（1 ページあたり最大 100） */
export async function bdlNbaGetAllPages<T>(
  path: string,
  query: Record<string, BdlQueryValue> = {}
): Promise<T[]> {
  const out: T[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 50; page++) {
    const body = await bdlNbaGetJson<BdlListResponse<T>>(path, {
      ...query,
      per_page: 100,
      ...(cursor != null ? { cursor } : {}),
    });
    const chunk = Array.isArray(body.data) ? body.data : [];
    out.push(...chunk);
    const next = body.meta?.next_cursor;
    if (next == null || chunk.length === 0) break;
    cursor = next;
  }
  return out;
}
