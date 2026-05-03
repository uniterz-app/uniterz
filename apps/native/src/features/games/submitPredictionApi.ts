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
