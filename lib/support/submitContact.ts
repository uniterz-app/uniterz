// lib/support/submitContact.ts — Web フォーム → /api/contact（Admin・レート制限）
import { auth } from "@/lib/firebase";

export type SubmitContactParams = {
  type: string;
  message: string;
  email?: string;
  screenshotUrl?: string;
  fromPath?: string;
  appVariant?: "web" | "mobile";
  userUid: string | null;
  userDisplayName: string | null;
};

export async function submitContact(params: SubmitContactParams) {
  const user = auth.currentUser;
  if (!user?.uid) {
    throw new Error("unauthorized");
  }
  const token = await user.getIdToken();
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: params.type,
      message: params.message,
      email: params.email,
      screenshotUrl: params.screenshotUrl,
      fromPath: params.fromPath,
      appVariant: params.appVariant,
      userDisplayName: params.userDisplayName,
    }),
  });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;
  if (!res.ok || !json?.ok) {
    const err = new Error(json?.error ?? "contact_failed");
    (err as { status?: number }).status = res.status;
    throw err;
  }
}
