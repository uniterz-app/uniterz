/** Web `lib/api/meRankingComment` 相当 */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("unauthorized");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMeRankingCommentNative(): Promise<{
  comment: string;
  isPro: boolean;
}> {
  const headers = await authHeader();
  const res = await fetch(`${getUniterzApiBaseUrl()}/api/me/ranking-comment`, {
    method: "GET",
    headers,
  });
  const data = (await res.json().catch(() => ({}))) as {
    comment?: string;
    isPro?: boolean;
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error ?? "error");
  return { comment: data.comment ?? "", isPro: data.isPro === true };
}

/** 空文字で削除。保存後の正規化済みテキストを返す */
export async function saveMeRankingCommentNative(comment: string): Promise<string> {
  const headers = await authHeader();
  const res = await fetch(`${getUniterzApiBaseUrl()}/api/me/ranking-comment`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    comment?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error ?? "error");
  return data.comment ?? "";
}
