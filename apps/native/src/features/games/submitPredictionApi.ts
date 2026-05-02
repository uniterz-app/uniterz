import { auth } from "../../lib/firebase";

/** Web アプリのオリジン（末尾スラッシュなし）。例: https://uniterz.example.com */
export function getUniterzApiBaseUrl(): string | null {
  const raw =
    process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.trim() ??
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export class PredictionApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly existingPostId?: string;

  constructor(
    message: string,
    opts: { status: number; code?: string; existingPostId?: string }
  ) {
    super(message);
    this.name = "PredictionApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.existingPostId = opts.existingPostId;
  }
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { _raw: text };
  }
}

/** Web `GET /api/posts_v2/:id` の応答（修正可否は `editable` を真とする） */
export type PredictionPostGetResult =
  | { ok: false; error: string }
  | { ok: true; exists: false }
  | {
      ok: true;
      exists: true;
      mine: boolean;
      editable: boolean;
      prediction?: {
        winner: "home" | "away" | "draw";
        score: { home: number; away: number };
      };
    };

/** 未応答の fetch でオーバーレイが永久に待たないようにする */
const PREDICTION_POST_GET_TIMEOUT_MS = 14_000;

export async function fetchPredictionPostGet(
  postId: string
): Promise<PredictionPostGetResult> {
  const base = getUniterzApiBaseUrl();
  if (!base) return { ok: false, error: "missing_api_base" };
  const user = auth.currentUser;
  if (!user) return { ok: false, error: "auth" };
  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    return { ok: false, error: "auth_token" };
  }

  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), PREDICTION_POST_GET_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${base}/api/posts_v2/${encodeURIComponent(postId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
  } catch (e: unknown) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") {
      return { ok: false, error: "timeout" };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network",
    };
  } finally {
    clearTimeout(tid);
  }

  let json: Record<string, unknown>;
  try {
    json = await parseJsonResponse(res);
  } catch {
    return { ok: false, error: "parse" };
  }
  if (!res.ok) {
    return {
      ok: false,
      error:
        (typeof json.error === "string" && json.error) || `HTTP ${res.status}`,
    };
  }
  if (json.exists === false) return { ok: true, exists: false };

  const predRaw = json.prediction as Record<string, unknown> | undefined;
  let prediction:
    | { winner: "home" | "away" | "draw"; score: { home: number; away: number } }
    | undefined;
  if (predRaw && typeof predRaw === "object") {
    const w = predRaw.winner;
    const s = predRaw.score as Record<string, unknown> | undefined;
    const h = s?.home;
    const a = s?.away;
    if (
      (w === "home" || w === "away" || w === "draw") &&
      typeof h === "number" &&
      typeof a === "number"
    ) {
      prediction = { winner: w, score: { home: h, away: a } };
    }
  }

  return {
    ok: true,
    exists: true,
    mine: Boolean(json.mine),
    editable: Boolean(json.editable),
    prediction,
  };
}

/** Web `POST /api/posts_v2` と同一ペイロード */
export async function createPredictionPostApi(input: {
  gameId: string;
  winner: "home" | "away" | "draw";
  scoreHome: number;
  scoreAway: number;
}): Promise<string> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new PredictionApiError("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。", {
      status: 0,
      code: "missing_api_base",
    });
  }
  const user = auth.currentUser;
  if (!user) {
    throw new PredictionApiError("ログインが必要です。", { status: 401, code: "auth" });
  }
  const token = await user.getIdToken();
  const url = `${base}/api/posts_v2`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      gameId: input.gameId,
      prediction: {
        winner: input.winner,
        score: { home: input.scoreHome, away: input.scoreAway },
      },
      comment: "",
    }),
  });
  const json = await parseJsonResponse(res);
  if (res.status === 409) {
    const existing =
      typeof json.existingId === "string" ? json.existingId : undefined;
    throw new PredictionApiError(
      typeof json.error === "string" ? json.error : "duplicate",
      { status: 409, code: "duplicate", existingPostId: existing }
    );
  }
  if (!res.ok) {
    const msg =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      `HTTP ${res.status}`;
    throw new PredictionApiError(msg, { status: res.status });
  }
  const id = typeof json.id === "string" ? json.id : null;
  if (!id) {
    throw new PredictionApiError("投稿IDが返りませんでした。", { status: res.status });
  }
  return id;
}

/** Web `PATCH /api/posts_v2/:id` と同一ペイロード */
export async function updatePredictionPostApi(
  postId: string,
  input: {
    winner: "home" | "away" | "draw";
    scoreHome: number;
    scoreAway: number;
  }
): Promise<void> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new PredictionApiError("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。", {
      status: 0,
      code: "missing_api_base",
    });
  }
  const user = auth.currentUser;
  if (!user) {
    throw new PredictionApiError("ログインが必要です。", { status: 401, code: "auth" });
  }
  const token = await user.getIdToken();
  const url = `${base}/api/posts_v2/${encodeURIComponent(postId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prediction: {
        winner: input.winner,
        score: { home: input.scoreHome, away: input.scoreAway },
      },
    }),
  });
  const json = await parseJsonResponse(res);
  if (!res.ok) {
    const msg =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      `HTTP ${res.status}`;
    throw new PredictionApiError(msg, { status: res.status });
  }
}

/** Web `DELETE /api/posts_v2/:id`（リザルト一覧のキックオフ前ゴミ箱）と同一 */
export async function deletePredictionPostApi(postId: string): Promise<void> {
  const base = getUniterzApiBaseUrl();
  if (!base) {
    throw new PredictionApiError("EXPO_PUBLIC_UNITERZ_API_BASE_URL が未設定です。", {
      status: 0,
      code: "missing_api_base",
    });
  }
  const user = auth.currentUser;
  if (!user) {
    throw new PredictionApiError("ログインが必要です。", { status: 401, code: "auth" });
  }
  const token = await user.getIdToken();
  const url = `${base}/api/posts_v2/${encodeURIComponent(postId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await parseJsonResponse(res);
  if (res.status === 403) {
    throw new PredictionApiError("削除できませんでした。", { status: 403 });
  }
  if (!res.ok && res.status !== 404) {
    const msg =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      `HTTP ${res.status}`;
    throw new PredictionApiError(msg, { status: res.status });
  }
}
