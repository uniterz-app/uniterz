"use client";

import { auth } from "@/lib/firebase";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("unauthorized");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMeRankingComment(): Promise<{
  comment: string;
  isPro: boolean;
}> {
  const headers = await authHeader();
  const res = await fetch("/api/me/ranking-comment", {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    comment?: string;
    isPro?: boolean;
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error ?? res.statusText);
  return { comment: data.comment ?? "", isPro: data.isPro === true };
}

/** 空文字で削除。保存後の正規化済みテキストを返す */
export async function saveMeRankingComment(comment: string): Promise<string> {
  const headers = await authHeader();
  const res = await fetch("/api/me/ranking-comment", {
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
