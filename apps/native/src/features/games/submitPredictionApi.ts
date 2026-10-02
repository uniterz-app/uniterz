import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "../../lib/firebase";

/** Metro / Expo が掴んでいる開発ホスト（実機は LAN IP、Simulator は 127.0.0.1） */
function metroDevHostname(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (
      Constants as {
        manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
      }
    ).manifest2?.extra?.expoClient?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string; hostUri?: string } })
      .manifest?.debuggerHost ??
    (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri ??
    null;
  if (typeof hostUri === "string" && hostUri.trim()) {
    const host = hostUri.trim().split(":")[0];
    if (host) return host;
  }
  if (Platform.OS === "android") return "10.0.2.2";
  return "127.0.0.1";
}

function isLocalDevHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  if (!h || h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/**
 * Web アプリのオリジン（末尾スラッシュなし）。例: https://uniterz.example.com
 * __DEV__ では Metro ホストを優先し、古い LAN IP のまま API 不通→NO DATA になるのを防ぐ。
 */
export function getUniterzApiBaseUrl(): string | null {
  const raw =
    process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.trim() ??
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ??
    process.env.EXPO_PUBLIC_APP_URL?.trim() ??
    "";

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    const metroHost = metroDevHostname();
    if (raw) {
      try {
        const url = new URL(raw.includes("://") ? raw : `http://${raw}`);
        if (isLocalDevHostname(url.hostname) && metroHost) {
          const port = url.port || "3000";
          return `http://${metroHost}:${port}`;
        }
        return raw.replace(/\/+$/, "");
      } catch {
        /* fall through */
      }
    }
    if (metroHost) return `http://${metroHost}:3000`;
  }

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

type GoalScorerPick = { playerId?: string; teamId?: string };

/** Web `POST /api/posts_v2` と同一ペイロード */
export async function createPredictionPostApi(input: {
  gameId: string;
  winner: "home" | "away" | "draw";
  scoreHome: number;
  scoreAway: number;
  goalScorer?: GoalScorerPick | null;
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
        ...(input.goalScorer ? { goalScorer: input.goalScorer } : {}),
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
    goalScorer?: GoalScorerPick | null;
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
        ...(input.goalScorer !== undefined ? { goalScorer: input.goalScorer } : {}),
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
